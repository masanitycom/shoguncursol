'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Header from '../../../../components/Header'
import AdminSidebar from '../../../../components/AdminSidebar'

interface PurchaseRequest {
    id: string
    created_at: string
    user: {
        email: string
    }
    nft_master: {
        name: string
        price: number
    }
    payment_method: 'bank_transfer' | 'usdt'
    status: 'pending' | 'approved' | 'rejected'
    profiles?: {
        email: string
    }
}

export default function PurchaseRequestsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
        fetchRequests()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    *,
                    nft_master!nft_id (
                        name,
                        price
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            
            // ユーザーメールアドレスを取得
            const userIds = data?.map(request => request.user_id) || []
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email')
                .in('id', userIds)

            if (userError) throw userError

            // データを結合
            const formattedData = data?.map(request => ({
                id: request.id,
                created_at: request.created_at,
                payment_method: request.payment_method,
                status: request.status,
                user: {
                    email: userData?.find(u => u.id === request.user_id)?.email || 'Unknown'
                },
                nft_master: request.nft_master
            })) || []

            setRequests(formattedData)
        } catch (error: any) {
            console.error('Error fetching requests:', error)
            setError(error.message)
        }
    }

    const handleApprove = async (requestId: string) => {
        setLoading(true)
        try {
            // トランザクションを使用して、申請を承認しNFTを付与
            const { data: request } = await supabase
                .from('nft_purchase_requests')
                .select('*')
                .eq('id', requestId)
                .single()

            if (!request) throw new Error('Request not found')

            // user_nftsにレコードを追加
            const { error: insertError } = await supabase
                .from('user_nfts')
                .insert({
                    user_id: request.user_id,
                    nft_id: request.nft_id,
                    status: 'active'
                })

            if (insertError) throw insertError

            // 申請のステータスを更新
            const { error: updateError } = await supabase
                .from('nft_purchase_requests')
                .update({ status: 'approved' })
                .eq('id', requestId)

            if (updateError) throw updateError

            // 一覧を再取得
            fetchRequests()

        } catch (error: any) {
            console.error('Error approving request:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (requestId: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({ status: 'rejected' })
                .eq('id', requestId)

            if (error) throw error
            fetchRequests()

        } catch (error: any) {
            console.error('Error rejecting request:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white mb-8">NFT購入申請一覧</h3>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="px-6 py-3 text-left text-white">申請日時</th>
                                        <th className="px-6 py-3 text-left text-white">ユーザー</th>
                                        <th className="px-6 py-3 text-left text-white">NFT</th>
                                        <th className="px-6 py-3 text-left text-white">価格</th>
                                        <th className="px-6 py-3 text-left text-white">支払方法</th>
                                        <th className="px-6 py-3 text-left text-white">ステータス</th>
                                        <th className="px-6 py-3 text-left text-white">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {requests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-750">
                                            <td className="px-6 py-4 text-white">
                                                {new Date(request.created_at).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.user.email}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.nft_master.name}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.nft_master.price.toLocaleString()} USDT
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.payment_method === 'bank_transfer' ? '銀行振込' : 'USDT送金'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-sm ${
                                                    request.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                                                    request.status === 'approved' ? 'bg-green-500 text-green-900' :
                                                    'bg-red-500 text-red-900'
                                                }`}>
                                                    {request.status === 'pending' ? '処理待ち' :
                                                     request.status === 'approved' ? '承認済み' : '却下'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {request.status === 'pending' && (
                                                    <div className="space-x-2">
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            disabled={loading}
                                                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            承認
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={loading}
                                                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            却下
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 