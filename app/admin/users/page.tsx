'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface User {
    id: string;
    email: string;
    user_id: string;
    name: string;         // 名前
    name_kana: string;    // フリガナ
    wallet_address: string;
    wallet_type: string;
    created_at: string;
    active: boolean;
}

interface EditingUser extends User {
    isEditing?: boolean
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<EditingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        wallet_address: '',
        wallet_type: 'EVOカード'
    })
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        fetchUsers()
    }

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    user_id,
                    name,
                    name_kana,
                    wallet_address,
                    wallet_type,
                    created_at,
                    active
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            console.log('Fetched users:', data)
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setSelectedUser(user)
        setEditForm({
            name: user.name || '',           // 名前
            email: user.email || '',
            wallet_address: user.wallet_address || '',
            wallet_type: user.wallet_type || 'EVOカード'
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) return

        setError(null)
        setSuccess(null)

        try {
            // プロフィール情報の更新（users テーブル）
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: editForm.name,          // 名前を更新
                    email: editForm.email,
                    wallet_address: editForm.wallet_address,
                    wallet_type: editForm.wallet_type
                })
                .eq('id', selectedUser.id)

            if (profileError) throw profileError

            setSuccess('ユーザー情報を更新しました')
            fetchUsers() // ユーザー一覧を再取得
            setIsEditModalOpen(false)
        } catch (error: any) {
            console.error('Update error:', error)
            setError('ユーザー情報の更新に失敗しました: ' + error.message)
        }
    }

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

    const deleteUser = async (userId: string) => {
        if (!confirm('このユーザーを削除してもよろしいですか？')) return

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId)

            if (error) throw error
            
            // 成功したら一覧を更新
            fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            alert('コピーしました')
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={null} isAdmin={true} />
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
                                                <td className="p-4">{user.user_id}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{user.name || '未設定'}</span>
                                                        <span className="text-sm text-gray-400">{user.email}</span>
                                                        <span className="text-xs text-gray-500">ID: {user.user_id}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="truncate max-w-[150px]">
                                                            {user.wallet_address || '未設定'}
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
                                                <td className="p-4">{user.wallet_type || '未設定'}</td>
                                                <td className="p-4">
                                                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded ${
                                                        user.active 
                                                            ? 'bg-green-600' 
                                                            : 'bg-red-600'
                                                    }`}>
                                                        {user.active ? 'active' : 'inactive'}
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
                                                            onClick={() => deleteUser(user.id)}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-96">
                        <h3 className="text-xl font-bold text-white mb-4">ユーザー情報の編集</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">名前</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">メールアドレス</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">ウォレットアドレス</label>
                                <input
                                    type="text"
                                    value={editForm.wallet_address}
                                    onChange={(e) => setEditForm({ ...editForm, wallet_address: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">ウォレットの種類</label>
                                <select
                                    value={editForm.wallet_type}
                                    onChange={(e) => setEditForm({ ...editForm, wallet_type: e.target.value })}
                                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                                >
                                    <option value="EVOカード">EVOカード</option>
                                    <option value="その他">その他のウォレット</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
} 