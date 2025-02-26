'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'
import { syncUserData } from '@/lib/utils/user-sync';
import { Modal, message as antMessage } from 'antd'

declare const navigator: Navigator
interface Navigator {
    clipboard: {
        writeText(text: string): Promise<void>
    }
}

interface UserProfile {
    id: string
    name: string
    email: string
    display_id: string | null
    status: string
    investment_amount: number
    total_team_investment: number
    active: boolean
    created_at: string
    wallet_address: string | null
    wallet_type: string | null
}

interface User {
    id: string;
    email: string;
    user_id: string;
    name: string;
    name_kana: string;
    wallet_address: string;
    wallet_type: string | null;
    created_at: string;
    active: boolean;
    profiles: UserProfile[];
}

interface EditingUser extends User {
    isEditing?: boolean
}

type WalletType = 'EVO' | 'その他' | '';

interface EditForm {
    name: string;
    email: string;
    wallet_address: string;
    wallet_type: WalletType;
}

interface UserUpdatePayload {
    name: string;
    name_kana: string;
    email: string;
    wallet_address: string;
    wallet_type?: string;  // undefinedを許容
}

// wallet_typeを適切な型に変換するヘルパー関数を追加
const convertToWalletType = (value: string | null): WalletType => {
    if (value === 'EVO' || value === 'その他') {
        return value;
    }
    return '';
};

export default function AdminUsersPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({
        name: '',
        email: '',
        wallet_address: '',
        wallet_type: ''
    })
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        const subscription = supabase
            .channel('user_updates')
            .on('broadcast', { event: 'user_updated' }, (payload) => {
                fetchUsers(); // データを再取得
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
        fetchUsers()
    }

    const fetchUsers = async () => {
        try {
            console.log('Fetching users data...')
            
            // profilesテーブルから必要なデータを全て取得
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    email,
                    display_id,
                    status,
                    active,
                    created_at,
                    investment_amount,
                    total_team_investment,
                    wallet_address,
                    wallet_type
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Fetched users:', data)
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: UserProfile) => {
        console.log('Editing user:', user);
        setSelectedUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            wallet_address: user.wallet_address || '',
            wallet_type: convertToWalletType(user.wallet_type)
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setError(null);
        setSuccess(null);

        try {
            const updateData = {
                name: editForm.name,
                email: editForm.email,
                wallet_address: editForm.wallet_address,
                wallet_type: editForm.wallet_type || null
            };

            // profilesテーブルを直接更新
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', selectedUser.id);

            if (error) throw error;

            setSuccess('ユーザー情報を更新しました');
            await fetchUsers();
            setIsEditModalOpen(false);

        } catch (error: any) {
            console.error('Update error:', error);
            setError('ユーザー情報の更新に失敗しました: ' + error.message);
        }
    };

    const updateUserStatus = async (userId: string, newStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ active: newStatus }) // statusカラムをactiveに変更
                .eq('id', userId)

            if (error) throw error
            
            fetchUsers()
        } catch (error) {
            console.error('Error updating user status:', error)
        }
    }

    const handleDelete = async (userId: string) => {
        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'ユーザーの削除に失敗しました');
            }

            // 成功時の処理（ユーザーリストの更新など）
            antMessage.success('ユーザーを削除しました');
            // リストを更新
            fetchUsers();

        } catch (error: any) {
            console.error('Delete error:', error);
            antMessage.error(error.message || 'ユーザーの削除に失敗しました');
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            antMessage.success('コピーしました')
        } catch (err) {
            console.error('Failed to copy:', err)
            antMessage.error('コピーに失敗しました')
        }
    }

    // ウォレットタイプの表示を修正
    const renderWalletType = (walletType: string | null) => {
        if (!walletType) return '未選択'  // NULLの場合は「未選択」と表示
        return walletType
    }

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
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
                <main className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">ユーザー管理</h1>

                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        {loading ? (
                            <div className="text-white">読み込み中...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-white">
                                    <thead>
                                        <tr className="text-left border-b border-gray-700">
                                            <th className="p-4 w-1/12">ID</th>
                                            <th className="p-4 w-2/12">ユーザー情報</th>
                                            <th className="p-4 w-2/12">ウォレットアドレス</th>
                                            <th className="p-4 w-1/12">種類</th>
                                            <th className="p-4 w-1/12">登録日</th>
                                            <th className="p-4 w-1/12">ステータス</th>
                                            <th className="p-4 w-2/12">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id} className="border-b border-gray-700">
                                                <td className="p-4">{user.display_id || '-'}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name || '-'}</span>
                                                        <span className="text-sm text-gray-400">{user.email || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="truncate max-w-[150px]">
                                                            {user.wallet_address || '-'}
                                                        </span>
                                                        {user.wallet_address && (
                                                            <button
                                                                onClick={() => copyToClipboard(user.wallet_address)}
                                                                className="text-gray-400 hover:text-white"
                                                            >
                                                                <ClipboardDocumentIcon className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">{renderWalletType(user.wallet_type)}</td>
                                                <td className="p-4">
                                                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded ${
                                                        user.active 
                                                            ? 'bg-green-600' 
                                                            : 'bg-red-600'
                                                    }`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs whitespace-nowrap"
                                                        >
                                                            編集
                                                        </button>
                                                        <button
                                                            onClick={() => updateUserStatus(user.id, !user.active)}
                                                            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs whitespace-nowrap"
                                                        >
                                                            {user.active ? '無効化' : '有効化'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs whitespace-nowrap"
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
                        )}
                    </div>
                </main>
            </div>
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-6">ユーザー情報の編集</h2>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    名前
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    ウォレットアドレス
                                </label>
                                <input
                                    type="text"
                                    name="wallet_address"
                                    value={editForm.wallet_address}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    ウォレットの種類
                                </label>
                                <select
                                    name="wallet_type"
                                    value={editForm.wallet_type}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    <option value="EVO">EVO</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                                >
                                    更新
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 