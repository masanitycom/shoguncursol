'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { PurchaseRequest as BasePurchaseRequest } from '@/types/nftPurchaseRequest'
import { message as antMessage, Modal } from 'antd'

// 既存の型を拡張
interface PurchaseRequest extends Omit<BasePurchaseRequest, 'status'> {
    user?: {
        id: string;
        name: string;
        email: string;
        display_id: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'deactivated';  // statusの型を拡張
}

interface NFTMaster {
    id: string
    name: string
    price: number
    daily_rate: number
    image_url: string | null
}

interface User {
    id: string;
    user_id: string;
    name_kana: string;
    wallet_address: string;
}

interface Profile {
    id: string
    name: string | null
    email: string | null
}

interface RawPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    payment_method: string;
    nfts: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    }[];
}

interface NFTSetting {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    status: string | null;
    owner_id: string | null;
    description: string | null;
}

interface EditRequestModalProps {
    request: PurchaseRequest;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedRequest: PurchaseRequest) => Promise<void>;
    onUpdateDates: () => Promise<void>;
}

interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    status: string | null;
    owner_id: string | null;
    description: string | null;
}

interface NFTPurchaseData {
    nft_settings: NFTSettings[];
}

interface SupabaseNFTResponse {
    nft_settings: Array<{
        price: number;
    }>;
}

interface PurchaseDataResponse {
    nft_settings: {
        price: number;
    }[];
}

interface PurchaseDataItem {
    nft_settings: {
        price: number;
    };
}

interface NFTPurchaseResponse {
    nft_settings: {
        price: number;
    }[];
}

interface NFTSettingsResponse {
    id: string;
    price: number;
    name: string;
    daily_rate: number;
    image_url: string | null;
}

interface EditDates {
    created_at: string;
    approved_at: string | null;
}

const EditRequestModal = ({ 
    request, 
    isOpen, 
    onClose, 
    onSave, 
    onUpdateDates 
}: EditRequestModalProps) => {
    // formDataの型を明示的に定義
    interface FormData {
        created_at: string;
        approved_at: string | null;
        status: 'pending' | 'approved' | 'rejected' | 'deactivated';  // deactivatedを追加
        nft_id: string;
    }

    const [formData, setFormData] = useState<FormData>({
        created_at: request.created_at ? new Date(request.created_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        approved_at: request.approved_at ? new Date(request.approved_at).toISOString().slice(0, 16) : null,
        status: request.status,
        nft_id: request.nft_id
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 日本時間から UTC に変換
            const created = new Date(formData.created_at || new Date());
            created.setHours(created.getHours() - 9);
            
            let approved: Date | null = null;
            if (formData.approved_at) {
                approved = new Date(formData.approved_at);
                approved.setHours(approved.getHours() - 9);
            }

            // updateDataの型を明示的に指定し、approved_atの型を調整
            const updateData: Omit<PurchaseRequest, 'approved_at'> & { approved_at: string | null } = {
                ...request,
                created_at: created.toISOString(),
                approved_at: approved?.toISOString() || null,
                status: formData.status,
                nft_id: formData.nft_id
            };

            // onSaveに渡す前に型を調整
            await onSave(updateData as PurchaseRequest);
            onClose();
        } catch (error) {
            console.error('Error updating request:', error);
            antMessage.error('更新に失敗しました');
        }
    };

    // 日時を日本時間に変換して表示
    const toLocalDateTime = (utcDate: string | null) => {
        if (!utcDate) return '';
        const date = new Date(utcDate);
        date.setHours(date.getHours() + 9);
        return date.toISOString().slice(0, 16);
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 ${isOpen ? 'block' : 'hidden'}`}>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl text-white mb-4">購入申請を編集</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300">申請日時</label>
                        <input
                            type="datetime-local"
                            value={toLocalDateTime(formData.created_at)}
                            onChange={(e) => setFormData({...formData, created_at: e.target.value})}
                            className="mt-1 block w-full rounded-md bg-gray-700 text-white"
                        />
                    </div>
                    {formData.status === 'approved' && (
                        <div>
                            <label className="block text-sm text-gray-300">承認日時</label>
                            <input
                                type="datetime-local"
                                value={toLocalDateTime(formData.approved_at)}
                                onChange={(e) => setFormData({...formData, approved_at: e.target.value})}
                                className="mt-1 block w-full rounded-md bg-gray-700 text-white"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-300">
                            ステータス
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({
                                ...formData, 
                                status: e.target.value as 'pending' | 'approved' | 'rejected' | 'deactivated'
                            })}
                            className="mt-1 block w-full rounded-md bg-gray-700 text-white"
                        >
                            <option value="pending">保留中</option>
                            <option value="approved">承認済み</option>
                            <option value="rejected">却下</option>
                            <option value="deactivated">無効化</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function PurchaseRequestsPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
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
    const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
    const [editDates, setEditDates] = useState<EditDates>({
        created_at: '',
        approved_at: null
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
            const { data, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    *,
                    nft:nft_settings(
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    ),
                    user:users(
                        id,
                        name,
                        email,
                        display_id
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            console.log('Purchase requests:', data)
            const formattedRequests: PurchaseRequest[] = data?.map(request => ({
                ...request,
                nft: {
                    id: request.nft?.id || '',
                    name: request.nft?.name || 'Unknown NFT',
                    price: request.nft?.price || 0,
                    daily_rate: request.nft?.daily_rate || 0,
                    image_url: request.nft?.image_url
                },
                user: {
                    id: request.user?.id || '',
                    name: request.user?.name || 'Unknown User',
                    email: request.user?.email || '',
                    display_id: request.user?.display_id || ''
                }
            })) || []
            setRequests(formattedRequests)
        } catch (error: any) {
            console.error('Error fetching requests:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    // 検索フィルター関数
    const filterRequests = (requests: PurchaseRequest[], searchTerm: string) => {
        let filtered = [...requests];
        
        if (searchTerm) {
            const searchTermUpper = searchTerm.toUpperCase();
            filtered = filtered.filter(request => {
                // NFT名での検索
                const nftNameMatch = request.nft?.name?.toUpperCase().includes(searchTermUpper) ?? false;
                
                // ユーザー情報での検索
                const userNameMatch = request.user?.name?.toUpperCase().includes(searchTermUpper) ?? false;
                const userEmailMatch = request.user?.email?.toUpperCase().includes(searchTermUpper) ?? false;
                
                return nftNameMatch || userNameMatch || userEmailMatch;
            });
        }
        
        return filtered;
    };

    useEffect(() => {
        let filtered = requests;
        
        // ステータスでフィルタリング
        if (statusFilter !== 'all') {
            filtered = filtered.filter(request => request.status === statusFilter);
        }

        // 検索語でフィルタリング
        if (searchTerm) {
            filtered = filterRequests(filtered, searchTerm);
        }

        setFilteredRequests(filtered);
    }, [requests, searchTerm, statusFilter]);

    const handleApprove = async (id: string) => {
        try {
            // 承認ステータスの更新
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // 承認済み購入データの取得（user_idも含める）
            const { data: purchaseData } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    user_id,
                    nft_settings:nft_settings!inner (
                        id,
                        price
                    )
                `)
                .eq('id', id)
                .single();

            if (!purchaseData) return;

            // 合計投資額を計算
            const nftSettings = purchaseData.nft_settings;
            const totalInvestment = Array.isArray(nftSettings) 
                ? nftSettings.reduce((sum, nft) => sum + (Number(nft.price) || 0), 0)
                : 0;

            // ユーザーの投資額を更新
            const { error: updateError } = await supabase
                .from('users')
                .update({ investment_amount: totalInvestment })
                .eq('id', purchaseData.user_id);

            if (updateError) throw updateError;

            await fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            antMessage.error('承認に失敗しました');
        }
    };

    const handleReject = async (id: string) => {
        try {
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({
                    status: 'rejected'
                })
                .eq('id', id);

            if (error) throw error;
            fetchRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            antMessage.error('却下に失敗しました');
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: '確認',
            content: '本当に削除しますか？',
            okText: '削除',
            cancelText: 'キャンセル',
            onOk: async () => {
                try {
                    const { error } = await supabase
                        .from('nft_purchase_requests')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    fetchRequests();
                    antMessage.success('リクエストを削除しました');
                } catch (error) {
                    console.error('Error deleting request:', error);
                    antMessage.error('削除に失敗しました');
                }
            }
        });
    };

    // ユーザーの投資額を再計算する関数を追加
    const recalculateUserInvestment = async (userId: string) => {
        try {
            // 承認済みのNFT購入履歴から合計金額を計算
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    nft_settings:nft_settings!inner (
                        id,
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved');

            if (purchaseError) throw purchaseError;
            if (!purchaseData) return 0;

            // 合計投資額を計算
            const totalInvestment = purchaseData.reduce((sum, item) => {
                const settings = item.nft_settings;
                if (!Array.isArray(settings)) return sum;
                
                return sum + settings.reduce((priceSum, nft) => {
                    return priceSum + (Number(nft.price) || 0);
                }, 0);
            }, 0);

            // ユーザーの投資額を更新
            const { error: updateError } = await supabase
                .from('users')
                .update({ investment_amount: totalInvestment })
                .eq('id', userId);

            if (updateError) throw updateError;

            return totalInvestment;
        } catch (error) {
            console.error('Error recalculating investment:', error);
            throw error;
        }
    };

    const handleSave = async (updatedRequest: PurchaseRequest | null) => {
        if (!updatedRequest) return;
        try {
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({
                    created_at: updatedRequest.created_at,
                    approved_at: updatedRequest.approved_at,
                    status: updatedRequest.status,
                    nft_id: updatedRequest.nft_id
                })
                .eq('id', updatedRequest.id);

            if (error) throw error;

            fetchRequests(); // リストを更新
            setIsEditModalOpen(false);
            setSelectedRequest(null);
            antMessage.success('リクエストを更新しました');
        } catch (error) {
            console.error('Error saving request:', error);
            antMessage.error('保存に失敗しました');
        }
    };

    // 統計情報を取得する関数を修正
    const fetchStats = async () => {
        try {
            const { data: purchases, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    status,
                    nfts:nft_settings (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `);

            if (error) throw error;

            // 型アサーション
            const typedPurchases = purchases as RawPurchaseRequest[];
            const summary = typedPurchases.reduce((acc, curr) => {
                const price = curr.nfts[0]?.price || 0;
                acc.totalValue += price;
                if (curr.status === 'approved') {
                    acc.approvedValue += price;
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
    const formatDateToJST = (dateString: string | null | undefined): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('ja-JP');
    };

    // 日付更新処理を修正
    const handleUpdateDates = async () => {
        try {
            // selectedRequestのnullチェック
            if (!selectedRequest) {
                console.error('No request selected');
                return;
            }

            const updates: {
                created_at?: string;
                approved_at?: string | null;
            } = {};
            
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
            await fetchRequests();
            antMessage.success('日付を更新しました');
        } catch (error) {
            console.error('Error updating dates:', error);
            antMessage.error('日付の更新に失敗しました');
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
            antMessage.error('NFTの無効化に失敗しました');
        }
    };

    const handleUpdate = async (id: string, data: any) => {
        try {
            const { error } = await supabase
                .from('nft_purchase_requests')
                .update({
                    created_at: data.created_at,
                    approved_at: data.approved_at,
                    nft_id: data.nft_id,
                    status: data.status
                })
                .eq('id', id);

            if (error) throw error;
            
            // 更新成功後の処理
            fetchRequests();  // リストを再取得
            setEditingRequest(null);  // 編集モードを終了
            antMessage.success('リクエストを更新しました');
        } catch (error) {
            console.error('Error updating request:', error);
            antMessage.error('更新に失敗しました');
        }
    };

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}
            />
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            ユーザー情報
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
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
                                                <div className="text-sm text-gray-300">
                                                    <div>{request.user?.name || 'Unknown User'}</div>
                                                    <div className="text-gray-400 text-xs">
                                                        ID: {request.user?.display_id || 'N/A'}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        {request.user?.email || 'No email'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="text-sm text-gray-300">{request.nft?.name || 'Unknown NFT'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <div className="text-sm text-gray-300">
                                                    ${request.nft?.price?.toLocaleString() || '0'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {/* 申請日時 */}
                                                {formatDateToJST(request.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {/* 承認日時（購入日時） */}
                                                {formatDateToJST(request.approved_at || null)}
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
                                                                onClick={() => handleReject(request.id)}
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
                                                        onClick={() => handleDelete(request.id)}
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

            {selectedRequest && (
                <EditRequestModal
                    request={selectedRequest}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedRequest(null);
                    }}
                    onSave={handleSave}
                    onUpdateDates={handleUpdateDates}
                />
            )}
        </div>
    )
} 