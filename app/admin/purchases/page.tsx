'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import AdminSidebar from '../../../components/AdminSidebar'
import Header from '../../../components/Header'
import { useRouter } from 'next/navigation'

interface PurchaseRequest {
    id: string
    user_id: string
    nft_id: string
    payment_method: 'bank_transfer' | 'usdt'
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    user_email: string
    display_name: string
    nft_name: string
    nft_price: number
}

export default function AdminPurchasesPage() {
    const [user, setUser] = useState<any>(null)
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()

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
                .from('purchase_requests_with_users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setRequests(data || [])
        } catch (error: any) {
            console.error('Error fetching requests:', error)
            setError('リクエストの取得に失敗しました')
        }
    }

    const handleApprove = async (requestId: string) => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            // 1. 購入リクエストとNFT情報を取得
            const { data: request, error: requestError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    *,
                    nft:nfts!inner (
                        id,
                        name,
                        price
                    )
                `)
                .eq('id', requestId)
                .single()

            if (requestError) throw requestError
            if (!request) throw new Error('リクエストが見つかりません')
            if (!request.nft) throw new Error('NFT情報が見つかりません')

            console.log('Approving request:', request)  // デバッグ用

            // 2. 購入リクエストを承認
            const { error: updateError } = await supabase
                .from('nft_purchase_requests')
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId)

            if (updateError) throw updateError

            // 3. ユーザーのNFT所有情報を追加
            const { error: nftError } = await supabase
                .from('user_nfts')
                .insert({
                    user_id: request.user_id,
                    nft_id: request.nft_id,
                    purchase_date: new Date().toISOString().split('T')[0],
                    status: 'active',
                    created_at: new Date().toISOString()
                })

            if (nftError) {
                console.error('NFT Error:', nftError)
                throw nftError
            }

            // 4. 総投資額を更新
            const { error: investmentError } = await supabase
                .rpc('update_user_investment', {
                    p_user_id: request.user_id,
                    p_amount: request.nft.price
                })

            if (investmentError) {
                console.error('Investment Error:', investmentError)
                throw investmentError
            }

            setSuccess('購入を承認しました')
            await fetchRequests()  // リストを更新
        } catch (error: any) {
            console.error('Error in handleApprove:', error)
            setError('承認に失敗しました: ' + error.message)
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
                <main className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">NFT購入リクエスト</h1>

                    {error && (
                        <div className="mb-4 p-4 bg-red-900 text-red-200 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-4 bg-green-900 text-green-200 rounded">
                            {success}
                        </div>
                    )}

                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        申請日時
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        ユーザー名
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        ユーザーID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        メールアドレス
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        NFT
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        支払い方法
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        ステータス
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(request.created_at).toLocaleString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.display_name || '名称未設定'} ({request.user_id.substring(0, 8)}...)
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.user_id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.user_email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.nft_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.payment_method === 'bank_transfer' ? '銀行振込' : 'USDT'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {request.status === 'pending' ? '未承認' :
                                                 request.status === 'approved' ? '承認済み' : '却下'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {request.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={loading}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    承認する
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    )
} 