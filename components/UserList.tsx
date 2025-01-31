'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface User {
    id: string
    email: string
    name: string | null
    wallet_type: string | null
    wallet_address: string | null
    created_at: string
    referrer_id: string | null
}

interface EditingUser extends Omit<User, 'referrer_id'> {
    referrer_id: string  // 編集中は常に文字列として扱う（空文字列を許可）
    original_email?: string  // 追加：元のメールアドレスを保持
}

export default function UserList() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<EditingUser | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            // プロフィール情報を取得
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false })

            if (profilesError) throw profilesError

            // auth.usersからメールアドレスを取得
            const { data: usersData, error: usersError } = await supabase
                .from('users')  // auth_usersではなくusersを使用
                .select('id, email')
                .in('id', profilesData.map(p => p.id))

            if (usersError) throw usersError

            // データを結合
            const combinedData = profilesData.map(profile => ({
                ...profile,
                email: usersData.find(user => user.id === profile.id)?.email || ''
            }))

            setUsers(combinedData)
        } catch (error: any) {
            console.error('Error fetching users:', error)
            setError('ユーザーの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser({
            ...user,
            referrer_id: user.referrer_id || '',
            name: user.name || '',
            wallet_type: user.wallet_type || '',
            wallet_address: user.wallet_address || '',
            original_email: user.email  // 元のメールアドレスを保存
        })
        setNewPassword('')
    }

    const handleSave = async (user: EditingUser) => {
        setLoading(true)
        setError(null)

        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    name: user.name || null,
                    wallet_type: user.wallet_type || null,
                    wallet_address: user.wallet_address || null,
                    referrer_id: user.referrer_id || null,  // 空文字列の場合はnullに変換
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            // メールアドレスの更新が必要な場合は管理者APIを使用
            if (user.email !== user.original_email) {
                // メールアドレスの更新は別途管理者用APIで実装
            }

            setSuccess('ユーザー情報を更新しました')
            fetchUsers()
        } catch (error: any) {
            console.error('Error updating user:', error)
            setError('ユーザー情報の更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm('このユーザーを削除してもよろしいですか？')) return

        try {
            const { error } = await supabase.auth.admin.deleteUser(userId)
            if (error) throw error
            
            fetchUsers()
        } catch (error: any) {
            console.error('Error deleting user:', error)
            setError('ユーザーの削除に失敗しました')
        }
    }

    if (loading) {
        return <div className="text-white">Loading...</div>
    }

    if (error) {
        return <div className="text-red-500">{error}</div>
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 text-white">
                <thead>
                    <tr>
                        <th className="px-6 py-3 text-left">名前（カタカナ）</th>
                        <th className="px-6 py-3 text-left">ユーザーID</th>
                        <th className="px-6 py-3 text-left">メールアドレス</th>
                        <th className="px-6 py-3 text-left">紹介者ID</th>
                        <th className="px-6 py-3 text-left">USDTアドレス</th>
                        <th className="px-6 py-3 text-left">ウォレットタイプ</th>
                        <th className="px-6 py-3 text-left">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-t border-gray-700">
                            {editingUser?.id === user.id ? (
                                <>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editingUser.name || ''}
                                            onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editingUser.id}
                                            onChange={(e) => setEditingUser({...editingUser, id: e.target.value})}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="email"
                                            value={editingUser.email}
                                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="新しいパスワード"
                                            className="bg-gray-700 px-2 py-1 rounded mt-1"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editingUser.referrer_id || ''}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                referrer_id: e.target.value
                                            })}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={editingUser.wallet_address || ''}
                                            onChange={(e) => setEditingUser({...editingUser, wallet_address: e.target.value})}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={editingUser.wallet_type || ''}
                                            onChange={(e) => setEditingUser({...editingUser, wallet_type: e.target.value})}
                                            className="bg-gray-700 px-2 py-1 rounded"
                                        >
                                            <option value="evocard">EVOカード</option>
                                            <option value="other">その他</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleSave(editingUser)}
                                            className="text-green-500 hover:text-green-400 mr-2"
                                        >
                                            保存
                                        </button>
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            className="text-gray-500 hover:text-gray-400"
                                        >
                                            キャンセル
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="px-6 py-4">{user.name || '-'}</td>
                                    <td className="px-6 py-4">{user.id}</td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{user.referrer_id || '-'}</td>
                                    <td className="px-6 py-4">{user.wallet_address || '-'}</td>
                                    <td className="px-6 py-4">
                                        {user.wallet_type === 'evocard' ? 'EVOカード' : 'その他'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="text-blue-500 hover:text-blue-400 mr-2"
                                        >
                                            編集
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            削除
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
} 