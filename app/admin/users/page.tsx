'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface User {
    id: string
    email: string
    name: string
    wallet_address: string
    wallet_type: string
    created_at: string
    active: boolean
}

interface EditingUser extends User {
    isEditing?: boolean
}

export default function AdminUsersPage() {
    const router = useRouter()
    const [users, setUsers] = useState<EditingUser[]>([])
    const [loading, setLoading] = useState(true)
    const [editForm, setEditForm] = useState<EditingUser | null>(null)

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
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setEditForm(user)
        setUsers(users.map(u => ({
            ...u,
            isEditing: u.id === user.id
        })))
    }

    const handleCancel = () => {
        setEditForm(null)
        setUsers(users.map(u => ({ ...u, isEditing: false })))
    }

    const handleUpdate = async (userId: string) => {
        if (!editForm) return

        try {
            // プロフィール情報の更新
            const { error } = await supabase
                .from('users')
                .update({
                    name: editForm.name,
                    email: editForm.email,
                    wallet_address: editForm.wallet_address,
                    wallet_type: editForm.wallet_type
                })
                .eq('id', userId)

            if (error) throw error

            handleCancel()
            fetchUsers()
            alert('更新が完了しました')
        } catch (error) {
            console.error('Error updating user:', error)
            alert('更新に失敗しました')
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
                                            <th className="p-4 w-2/12">メールアドレス</th>
                                            <th className="p-4 w-2/12">名前</th>
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
                                                <td className="p-4">{user.id}</td>
                                                {user.isEditing ? (
                                                    <>
                                                        <td className="p-4">
                                                            <input
                                                                type="email"
                                                                value={editForm?.email || ''}
                                                                onChange={e => setEditForm(prev => prev ? { ...prev, email: e.target.value } : null)}
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <input
                                                                type="text"
                                                                value={editForm?.name || ''}
                                                                onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <input
                                                                type="text"
                                                                value={editForm?.wallet_address || ''}
                                                                onChange={e => setEditForm(prev => prev ? { ...prev, wallet_address: e.target.value } : null)}
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <select
                                                                value={editForm?.wallet_type || ''}
                                                                onChange={e => setEditForm(prev => prev ? { ...prev, wallet_type: e.target.value } : null)}
                                                                className="w-full bg-gray-700 text-white px-2 py-1 rounded"
                                                            >
                                                                <option value="EVOカード">EVOカード</option>
                                                                <option value="その他">その他のウォレット</option>
                                                            </select>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-4">{user.email}</td>
                                                        <td className="p-4">{user.name}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="truncate max-w-[150px]">{user.wallet_address}</span>
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
                                                        <td className="p-4">{user.wallet_type}</td>
                                                    </>
                                                )}
                                                <td className="p-4">
                                                    {new Date(user.created_at).toLocaleDateString()}
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
                                                        {user.isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdate(user.id)}
                                                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                                                >
                                                                    保存
                                                                </button>
                                                                <button
                                                                    onClick={handleCancel}
                                                                    className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                                                >
                                                                    キャンセル
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
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
                                                            </>
                                                        )}
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
        </div>
    )
} 