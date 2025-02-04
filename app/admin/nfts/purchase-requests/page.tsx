'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

interface NFT {
    id: string;
    name: string;
    price: number;
}

interface User {
    id: string;
    user_id: string;
    name_kana: string;
    wallet_address: string;
}

interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_name: string;
    nft_price: number;
    nft_daily_rate: number;
    nft_image_url: string | null;
    user_email: string;
    user_display_name: string | null;
    nfts?: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    };
    users?: {
        id: string;
        name: string;
    };
}

export default function PurchaseRequestsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [requests, setRequests] = useState<PurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([])
    const [deletingRequest, setDeletingRequest] = useState<PurchaseRequest | null>(null)
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState<any>(null)
    const [editDates, setEditDates] = useState({
        created_at: '',
        approved_at: ''
    })
    const [statusFilter, setStatusFilter] = useState<string>('all')

    useEffect(() => {
        checkAuth()
        fetchRequests()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
        } catch (error) {
            console.error('Error checking auth:', error)
        }
    }

    const fetchRequests = async () => {
        try {
            // まず購入リクエストとNFT情報を取得
            const { data: requests, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    *,
                    nfts:nft_settings (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // 次にプロフィール情報を別途取得
            const userIds = requests?.map(req => req.user_id) || [];
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (profileError) throw profileError;

            // データを結合して整形
            const formattedRequests = requests?.map(request => {
                const profile = profiles?.find(p => p.id === request.user_id);
                return {
                    id: request.id,
                    user_id: request.user_id,
                    status: request.status,
                    created_at: request.created_at,
                    approved_at: request.approved_at,
                    nft_id: request.nft_id,
                    nft_name: request.nfts?.name || 'Unknown NFT',
                    nft_price: request.nfts?.price || 0,
                    nft_daily_rate: request.nfts?.daily_rate || 0,
                    nft_image_url: request.nfts?.image_url,
                    user_display_name: profile?.name || 'Unknown Name'
                };
            }) || [];

            setRequests(formattedRequests);
            setFilteredRequests(formattedRequests);
        } catch (error: any) {
            console.error('Error fetching requests:', error);
            setError('リクエストの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // 検索フィルター関数
    useEffect(() => {
        let filtered = requests;
        
        // ステータスでフィルタリング
        if (statusFilter !== 'all') {
            filtered = filtered.filter(request => request.status === statusFilter);
        }

        // 検索語でフィルタリング
        if (searchTerm) {
            const searchTermUpper = searchTerm.toUpperCase();
            filtered = filtered.filter(request => 
                request.user_display_name?.toUpperCase().includes(searchTermUpper) ||
                request.nft_name?.toUpperCase().includes(searchTermUpper)
            );
        }

        setFilteredRequests(filtered);
    }, [requests, searchTerm, statusFilter]);

    const handleApprove = async (requestId: string) => {
        try {
            // JSTで現在時刻を取得
            const jstNow = new Date();
            jstNow.setHours(jstNow.getHours() - 9); // JSTからUTCに変換
            const now = jstNow.toISOString();

            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({
                    status: 'approved',
                    approved_at: now,
                    created_at: now
                })
                .eq('id', requestId);

            if (error) throw error;
            
            console.log('Request approved:', {
                requestId,
                approved_at: now,
                created_at: now
            });
            
            fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
        }
    };

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

    // 削除処理の関数を追加
    const handleDelete = async (request: PurchaseRequest) => {
        if (!window.confirm('このNFTを削除してもよろしいですか？\n※この操作は取り消せません。')) {
            return
        }

        setLoading(true)
        try {
            // NFTを削除
            const { error: nftError } = await supabase
                .from('nfts')
                .delete()
                .eq('id', request.nft_id)

            if (nftError) throw nftError

            // 購入履歴も削除
            const { error: requestError } = await supabase
                .from('nft_purchase_requests')
                .delete()
                .eq('id', request.id)

            if (requestError) throw requestError

            // 画面を更新
            fetchRequests()
            setError('NFTを削除しました')
        } catch (error) {
            console.error('Error deleting NFT:', error)
            setError('NFTの削除に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const formatRequest = (request: any): PurchaseRequest => ({
        id: request.id,
        user_id: request.user_id,
        status: request.status,
        created_at: request.created_at,
        approved_at: request.approved_at,
        nft_id: request.nft_id,
        nft_name: request.nfts?.name || 'Unknown NFT',
        nft_price: request.nfts?.price || 0,
        nft_daily_rate: request.nfts?.daily_rate || 0,
        nft_image_url: request.nfts?.image_url,
        user_display_name: request.users?.name || 'Unknown Name'
    })

    // 統計情報を取得する関数を修正
    const fetchStats = async () => {
        try {
            const { data: stats, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    status,
                    nft_settings!nft_id (
                        price
                    )
                `);

            if (error) throw error;

            const summary = stats.reduce((acc, curr) => {
                if (curr.nft_settings) {
                    const price = Number(curr.nft_settings.price);
                    acc.totalValue += price;
                    if (curr.status === 'approved') {
                        acc.approvedValue += price;
                    }
                }
                return acc;
            }, { totalValue: 0, approvedValue: 0 });

            return summary;
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    };

    // 日付をJST（日本時間）で表示する関数を追加
    const formatDateToJST = (dateString: string | null): string => {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        // UTCからJSTに変換（+9時間）
        date.setHours(date.getHours() + 9);
        
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Tokyo'
        });
    };

    // 日付更新処理を修正
    const handleUpdateDates = async () => {
        try {
            const updates: any = {};
            
            // 入力された日付をUTCに変換
            if (editDates.created_at) {
                const createdDate = new Date(editDates.created_at);
                createdDate.setHours(createdDate.getHours() - 9);
                updates.created_at = createdDate.toISOString();
            }

            if (selectedRequest.status === 'approved' && editDates.approved_at) {
                const approvedDate = new Date(editDates.approved_at);
                approvedDate.setHours(approvedDate.getHours() - 9);
                updates.approved_at = approvedDate.toISOString();
            }

            const { error } = await supabase
                .from('nft_purchase_requests')
                .update(updates)
                .eq('id', selectedRequest.id);

            if (error) throw error;
            
            console.log('Dates updated:', {
                requestId: selectedRequest.id,
                ...updates
            });
            
            setIsEditModalOpen(false);
            fetchRequests();
        } catch (error) {
            console.error('Error updating dates:', error);
        }
    };

    const handleDeactivateNFT = async (nftId: string) => {
        try {
            // NFTのステータスを更新
            const { error: nftError } = await supabase
                .from('nfts')
                .update({ status: 'inactive' })
                .eq('id', nftId);

            if (nftError) throw nftError;

            // 関連する購入リクエストも無効化
            const { error: requestError } = await supabase
                .from('nft_purchase_requests')
                .update({ status: 'deactivated' })
                .eq('nft_id', nftId);

            if (requestError) throw requestError;

            fetchRequests(); // リストを更新
        } catch (error) {
            console.error('Error deactivating NFT:', error);
        }
    };

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

                        {/* ステータスフィルターを追加 */}
                        <div className="flex space-x-4 mb-4">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-gray-700 text-white rounded px-3 py-2"
                            >
                                <option value="all">すべて</option>
                                <option value="pending">処理待ち</option>
                                <option value="approved">承認済み</option>
                                <option value="rejected">却下</option>
                                <option value="deactivated">無効</option>
                            </select>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            ユーザー
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            NFT
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            価格
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            購入日
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            承認日
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            ステータス
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            アクション
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {request.user_display_name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        ID: {request.user_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="text-sm text-gray-300">{request.nft_name || 'Unknown NFT'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="text-sm text-gray-300">
                                                    ${request.nft_price?.toLocaleString() || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {/* 申請日時 */}
                                                {formatDateToJST(request.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {/* 承認日時（購入日時） */}
                                                {formatDateToJST(request.approved_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <span className={`px-2 py-1 rounded text-sm ${
                                                    request.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                                                    request.status === 'approved' ? 'bg-green-500 text-green-900' :
                                                    request.status === 'deactivated' ? 'bg-gray-500 text-gray-900' :
                                                    'bg-red-500 text-red-900'
                                                }`}>
                                                    {request.status === 'pending' ? '処理待ち' :
                                                     request.status === 'approved' ? '承認済み' :
                                                     request.status === 'deactivated' ? '無効化' :
                                                     '却下'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="space-x-2">
                                                    {request.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(request.id)}
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
                                                        onClick={() => {
                                                            setIsEditModalOpen(true)
                                                            setSelectedRequest(request)
                                                            setEditDates({
                                                                created_at: request.created_at,
                                                                approved_at: request.approved_at || ''
                                                            })
                                                        }}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                                    >
                                                        編集
                                                    </button>
                                                    {request.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleDeactivateNFT(request.nft_id)}
                                                            className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                                                        >
                                                            無効化
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(request)}
                                                        disabled={loading}
                                                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        削除
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

            {isEditModalOpen && (
                <EditRequestModal
                    request={selectedRequest}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        setSelectedRequest(null)
                    }}
                    onSave={handleSave}
                    onUpdateDates={handleUpdateDates}
                    editDates={editDates}
                    setEditDates={setEditDates}
                />
            )}
        </div>
    )
}

function EditRequestModal({ request, onClose, onSave, onUpdateDates, editDates, setEditDates }: {
    request: PurchaseRequest
    onClose: () => void
    onSave: (updatedRequest: PurchaseRequest) => Promise<void>
    onUpdateDates: () => Promise<void>
    editDates: {
        created_at: string
        approved_at: string
    }
    setEditDates: React.Dispatch<React.SetStateAction<{
        created_at: string
        approved_at: string
    }>>
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
                        <label className="block text-sm font-medium mb-1 text-white">
                            申請日時
                        </label>
                        <input
                            type="datetime-local"
                            value={editDates.created_at.slice(0, 16)}
                            onChange={(e) => setEditDates({
                                ...editDates,
                                created_at: e.target.value
                            })}
                            className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600"
                        />
                    </div>
                    {request.status === 'approved' && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-white">
                                承認日時（購入日時）
                            </label>
                            <input
                                type="datetime-local"
                                value={editDates.approved_at?.slice(0, 16) || ''}
                                onChange={(e) => setEditDates({
                                    ...editDates,
                                    approved_at: e.target.value
                                })}
                                className="w-full bg-gray-700 rounded p-2 text-white border border-gray-600"
                            />
                        </div>
                    )}
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
                        onClick={() => {
                            onSave({ ...request, ...formData })
                            onUpdateDates()
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    )
} 