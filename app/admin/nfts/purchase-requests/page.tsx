'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Header from '../../../../components/Header'
import AdminSidebar from '../../../../components/AdminSidebar'

interface PurchaseRequest {
    id: string
    created_at: string
    approved_at?: string
    user_id: string
    nft_id: string
    user: {
        name_kana: string
        user_id: string
    }
    nfts: {
        id: string
        name: string
        price: number
    }
    payment_method: 'bank_transfer' | 'usdt'
    status: 'pending' | 'approved' | 'rejected'
}

interface NFT {
    id: string
    name: string
    price: number
}

export default function PurchaseRequestsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([])

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
            // まず購入申請データを取得
            const { data: requests, error: requestError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    created_at,
                    approved_at,
                    user_id,
                    nft_id,
                    payment_method,
                    status,
                    nfts (
                        id,
                        name,
                        price
                    )
                `)
                .order('created_at', { ascending: false })

            if (requestError) {
                console.error('Request error:', requestError)
                throw requestError
            }

            // 関連するユーザー情報を別途取得
            const userIds = requests?.map(request => request.user_id) || []
            const { data: users, error: userError } = await supabase
                .from('users')
                .select('id, user_id, name_kana, wallet_address')
                .in('id', userIds)

            if (userError) throw userError

            // データを結合
            const formattedRequests = requests?.map(request => ({
                ...request,
                user: users?.find(u => u.id === request.user_id) || { 
                    name_kana: '不明',
                    user_id: '不明'
                }
            }))

            setRequests(formattedRequests || [])
        } catch (error: any) {
            console.error('Error fetching requests:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // 検索フィルター関数
    useEffect(() => {
        if (!searchTerm) {
            setFilteredRequests(requests)
            return
        }

        const filtered = requests.filter(request => {
            const searchTermUpper = searchTerm.toUpperCase()
            return (
                request.user.user_id.toUpperCase().includes(searchTermUpper) ||
                request.user.name_kana.toUpperCase().includes(searchTermUpper)
            )
        })
        setFilteredRequests(filtered)
    }, [searchTerm, requests])

    const handleApprove = async (request: PurchaseRequest) => {
        try {
            const response = await fetch('/api/admin/nft/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nftRequest: request,
                    userId: request.user_id
                })
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('API Error:', data)
                throw new Error(data.error + (data.details ? `\n${JSON.stringify(data.details)}` : ''))
            }

            // 一覧を再取得
            await fetchRequests()

        } catch (error: any) {
            console.error('Error approving request:', error)
            setError(error.message)
        }
    }

    const handleReject = async (request: PurchaseRequest) => {
        try {
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({ status: 'rejected' })
                .eq('id', request.id)

            if (error) throw error
            fetchRequests()
        } catch (error: any) {
            console.error('Error rejecting request:', error)
            setError(error.message)
        }
    }

    // ユーザーの投資額を再計算する関数を追加
    const recalculateUserInvestment = async (userId: string) => {
        try {
            console.log('Recalculating investment for user:', userId)

            // 1. ユーザーの承認済み購入履歴をすべて取得
            const { data: purchases, error: purchasesError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    nfts (
                        id,
                        name,
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')

            if (purchasesError) throw purchasesError
            console.log('Found approved purchases:', purchases)

            // 2. 総投資額を計算
            const totalInvestment = purchases?.reduce((sum, purchase) => {
                const price = purchase.nfts?.price || 0
                console.log(`Adding NFT price: ${price} to sum: ${sum}`)
                return sum + price
            }, 0) || 0

            console.log('Calculated total investment:', totalInvestment)

            // 3. ユーザーの投資額を更新
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    investment_amount: totalInvestment,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) {
                console.error('Error updating user investment:', updateError)
                throw updateError
            }

            // 4. 更新後の値を確認
            const { data: updatedUser, error: checkError } = await supabase
                .from('users')
                .select('investment_amount')
                .eq('id', userId)
                .single()

            if (checkError) {
                console.error('Error checking updated value:', checkError)
            } else {
                console.log('Updated investment amount confirmed:', updatedUser?.investment_amount)
            }

            return totalInvestment
        } catch (error) {
            console.error('Error recalculating investment:', error)
            throw error
        }
    }

    const handleSave = async (updatedRequest: PurchaseRequest) => {
        try {
            console.log('Starting save process...', updatedRequest)

            // 購入申請の更新
            const { error: updateError } = await supabase
                .from('nft_purchase_requests')
                .update({
                    created_at: updatedRequest.created_at,
                    approved_at: updatedRequest.status === 'approved' ? updatedRequest.created_at : null,
                    status: updatedRequest.status,
                    nft_id: updatedRequest.nft_id
                })
                .eq('id', updatedRequest.id)

            if (updateError) {
                console.error('Purchase request update error:', updateError)
                throw updateError
            }

            // NFTの所有者情報の更新（承認済みの場合のみ）
            if (updatedRequest.status === 'approved') {
                const { error: nftError } = await supabase
                    .from('nfts')
                    .update({
                        owner_id: updatedRequest.user_id,
                        last_transferred_at: updatedRequest.created_at
                    })
                    .eq('id', updatedRequest.nft_id)

                if (nftError) {
                    console.error('NFT update error:', nftError)
                    setError('NFTの所有者情報の更新に失敗しましたが、申請状態は更新されました')
                }

                // 投資額を再計算
                await recalculateUserInvestment(updatedRequest.user_id)
            }

            setEditingRequest(null)
            fetchRequests()
            
        } catch (error: any) {
            console.error('Error updating request:', error)
            setError('更新に失敗しました: ' + error.message)
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
                        <h3 className="text-3xl font-medium text-white mb-4">NFT購入申請一覧</h3>

                        {/* 検索ボックスを追加 */}
                        <div className="mb-6">
                            <div className="max-w-md">
                                <label htmlFor="search" className="block text-sm font-medium text-white mb-2">
                                    ユーザー検索（IDまたは名前）
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="ユーザーIDまたは名前で検索..."
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                {searchTerm && (
                                    <p className="mt-2 text-sm text-gray-400">
                                        検索結果: {filteredRequests.length} 件
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="px-6 py-3 text-left text-white">申請日時</th>
                                        <th className="px-6 py-3 text-left text-white">ユーザー情報</th>
                                        <th className="px-6 py-3 text-left text-white">NFT</th>
                                        <th className="px-6 py-3 text-left text-white">価格</th>
                                        <th className="px-6 py-3 text-left text-white">支払方法</th>
                                        <th className="px-6 py-3 text-left text-white">ステータス</th>
                                        <th className="px-6 py-3 text-left text-white">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-750">
                                            <td className="px-6 py-4 text-white">
                                                {new Date(request.created_at).toLocaleString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{request.user.name_kana}</span>
                                                    <span className="text-sm text-gray-400">ID: {request.user.user_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.nfts.name}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {request.nfts.price.toLocaleString()} USDT
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
                                                <div className="space-x-2">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(request)}
                                                                disabled={loading}
                                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                承認
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(request)}
                                                                disabled={loading}
                                                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                                            >
                                                                却下
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => setEditingRequest(request)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                    >
                                                        編集
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {editingRequest && (
                <EditRequestModal
                    request={editingRequest}
                    onClose={() => setEditingRequest(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    )
}

function EditRequestModal({ request, onClose, onSave }: {
    request: PurchaseRequest
    onClose: () => void
    onSave: (updatedRequest: PurchaseRequest) => Promise<void>
}) {
    const [formData, setFormData] = useState({
        created_at: request.created_at,
        approved_at: request.approved_at || '',
        status: request.status,
        nft_id: request.nft_id
    })
    const [availableNFTs, setAvailableNFTs] = useState<NFT[]>([])

    // 利用可能なNFTを取得
    useEffect(() => {
        const fetchNFTs = async () => {
            const { data: nfts, error } = await supabase
                .from('nfts')
                .select('id, name, price')
                .order('name')

            if (error) {
                console.error('Error fetching NFTs:', error)
                return
            }

            setAvailableNFTs(nfts || [])
        }

        fetchNFTs()
    }, [])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-96 border border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-white">購入履歴の編集</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-white">NFT</label>
                        <select
                            value={formData.nft_id}
                            onChange={e => setFormData({
                                ...formData,
                                nft_id: e.target.value
                            })}
                            className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            {availableNFTs.map(nft => (
                                <option key={nft.id} value={nft.id}>
                                    {nft.name} ({nft.price.toLocaleString()} USDT)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-white">申請日時</label>
                        <input
                            type="datetime-local"
                            value={formData.created_at.slice(0, 16)}
                            onChange={e => setFormData({
                                ...formData,
                                created_at: new Date(e.target.value).toISOString()
                            })}
                            className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-white">承認日時</label>
                        <input
                            type="datetime-local"
                            value={formData.approved_at?.slice(0, 16) || ''}
                            onChange={e => setFormData({
                                ...formData,
                                approved_at: new Date(e.target.value).toISOString()
                            })}
                            className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-white">ステータス</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({
                                ...formData,
                                status: e.target.value as PurchaseRequest['status']
                            })}
                            className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="pending">処理待ち</option>
                            <option value="approved">承認済み</option>
                            <option value="rejected">却下</option>
                        </select>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={() => onSave({ ...request, ...formData })}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
} 