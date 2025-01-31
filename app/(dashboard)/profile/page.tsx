"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
    id: string
    name: string
    email: string
    wallet_address: string
    wallet_type: string
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        wallet_address: '',
        wallet_type: 'EVOカード'
    })
    const [showPasswordChange, setShowPasswordChange] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchUserProfile()

        // より頻繁に（2秒ごと）にプロフィール情報を更新
        const interval = setInterval(() => {
            if (user?.id) {
                fetchUserProfile()
            }
        }, 2000)

        return () => clearInterval(interval)
    }, [user?.id])

    const fetchUserProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error) throw error
            if (data) {
                // 現在のデータと新しいデータを比較
                if (JSON.stringify(data) !== JSON.stringify(user)) {
                    setUser(data)
                    setEditForm({
                        name: data.name || '',
                        email: data.email || '',
                        wallet_address: data.wallet_address || '',
                        wallet_type: data.wallet_type || 'EVOカード'
                    })
                    // 変更があった場合はメッセージを表示
                    setSuccess('プロフィール情報が更新されました')
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            // メールアドレスの更新
            if (editForm.email !== user?.email) {
                const { error: authError } = await supabase.auth.updateUser({
                    email: editForm.email
                })
                if (authError) throw authError
            }

            // プロフィール情報の更新
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: editForm.name,
                    email: editForm.email, // メールアドレスも更新
                    wallet_address: editForm.wallet_address,
                    wallet_type: editForm.wallet_type
                })
                .eq('id', user?.id)

            if (profileError) throw profileError

            setSuccess('プロフィールを更新しました')
            fetchUserProfile()
            setIsEditing(false)
        } catch (error: any) {
            console.error('Update error:', error)
            setError('プロフィールの更新に失敗しました: ' + error.message)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('新しいパスワードが一致しません')
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            })

            if (error) throw error

            setSuccess('パスワードを更新しました')
            setShowPasswordChange(false)
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error: any) {
            setError('パスワードの更新に失敗しました')
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">プロフィール</h2>

                {error && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded text-green-200">
                        {success}
                    </div>
                )}

                <div className="space-y-6">
                    {/* プロフィール情報 */}
                    <div className="bg-gray-700 rounded-lg p-6">
                        {!isEditing ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-400">ID</p>
                                        <p className="text-white font-medium">{user?.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">名前</p>
                                        <p className="text-white font-medium">{user?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">メールアドレス</p>
                                        <p className="text-white font-medium">{user?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">ウォレットアドレス</p>
                                        <p className="text-white font-medium">{user?.wallet_address}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400">ウォレットの種類</p>
                                        <p className="text-white font-medium">{user?.wallet_type}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex space-x-4">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        編集する
                                    </button>
                                    <button
                                        onClick={() => setShowPasswordChange(true)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        パスワード変更
                                    </button>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">名前</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">メールアドレス</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">ウォレットアドレス</label>
                                    <input
                                        type="text"
                                        value={editForm.wallet_address}
                                        onChange={(e) => setEditForm({ ...editForm, wallet_address: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">ウォレットの種類</label>
                                    <select
                                        value={editForm.wallet_type}
                                        onChange={(e) => setEditForm({ ...editForm, wallet_type: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    >
                                        <option value="EVOカード">EVOカード</option>
                                        <option value="その他">その他のウォレット</option>
                                    </select>
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        保存
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* パスワード変更フォーム */}
                    {showPasswordChange && (
                        <div className="bg-gray-700 rounded-lg p-6">
                            <h3 className="text-xl font-bold text-white mb-4">パスワード変更</h3>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">現在のパスワード</label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">新しいパスワード</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">新しいパスワード（確認）</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        パスワードを変更
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordChange(false)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 紹介コードセクション */}
                    <div className="bg-gray-700 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4">紹介コード</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 mb-2">あなたの紹介コード</p>
                                <p className="text-2xl font-bold text-white">{user?.id}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(user?.id || '')
                                    setSuccess('紹介コードをコピーしました')
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                                コピー
                            </button>
                        </div>
                        <div className="mt-4 text-gray-400">
                            <p>※ このコードを共有して新規メンバーを紹介できます</p>
                            <p>※ 紹介したメンバーが登録すると、特別なボーナスを獲得できます</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 