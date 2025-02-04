'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'

interface UserProfile {
    id: string
    email: string
    name: string | null
    wallet_type: string | null
    wallet_address: string | null
}

function MyPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        wallet_type: '',
        wallet_address: ''
    })
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    })

    useEffect(() => {
        checkAuth()
        const error = searchParams.get('error')
        if (error === 'wallet-required') {
            setError('報酬を申請するにはウォレット情報の設定が必要です')
            setEditMode(true)
        }
    }, [searchParams])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (profileError && profileError.code !== 'PGRST116') throw profileError

            const userData: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || null,
                wallet_type: profile?.wallet_type || null,
                wallet_address: profile?.wallet_address || null
            }

            setUser(userData)
            setFormData({
                email: userData.email,
                name: userData.name || '',
                wallet_type: userData.wallet_type || '',
                wallet_address: userData.wallet_address || ''
            })
        } catch (error: any) {
            console.error('Error fetching user:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    name: formData.name || null,
                    wallet_type: formData.wallet_type || null,
                    wallet_address: formData.wallet_address || null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                })

            if (error) throw error
            setSuccess('プロフィールを更新しました')
            setEditMode(false)
            checkAuth()
        } catch (error: any) {
            console.error('Error updating profile:', error)
            setError('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordUpdate = async () => {
        if (passwordData.password !== passwordData.confirmPassword) {
            setError('パスワードが一致しません')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.password
            })

            if (error) throw error

            setSuccess('パスワードを更新しました')
            setShowPasswordForm(false)
            setPasswordData({ password: '', confirmPassword: '' })
        } catch (error: any) {
            console.error('Error updating password:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                onLogout={handleLogout}
            />
            <main className="container mx-auto px-4 py-8">
                <Link 
                    href="/dashboard" 
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 group"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    ダッシュボードに戻る
                </Link>

                <h1 className="text-3xl font-bold text-white mb-8">マイページ</h1>

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

                <div className="space-y-6">
                    {/* プロフィール情報 */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">プロフィール情報</h2>
                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                >
                                    編集
                                </button>
                            )}
                        </div>

                        {editMode ? (
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 mb-2">ユーザーID</label>
                                    <p className="text-white font-mono">{user.id}</p>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">メールアドレス</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">名前（カタカナ）</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">ウォレットの種類</label>
                                    <select
                                        value={formData.wallet_type}
                                        onChange={(e) => setFormData({ ...formData, wallet_type: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                    >
                                        <option value="">選択してください</option>
                                        <option value="evocard">EVOカード</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 mb-2">USDTアドレス</label>
                                    <input
                                        type="text"
                                        value={formData.wallet_address}
                                        onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600"
                                    />
                                </div>
                                <div className="flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? '更新中...' : '保存'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">ユーザーID</span>
                                    <span className="text-white font-mono">{user.id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">メールアドレス</span>
                                    <span className="text-white">{user.email}</span>
                                </div>
                                <div>
                                    <p className="text-gray-400">名前（カタカナ）</p>
                                    <p className="text-white">{formData.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">ウォレットの種類</p>
                                    <p className="text-white">
                                        {formData.wallet_type === 'evocard' ? 'EVOカード' : 
                                         formData.wallet_type === 'other' ? 'その他' : '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400">USDTアドレス</p>
                                    <p className="text-white">{formData.wallet_address || '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* パスワード変更セクション */}
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-6">パスワード変更</h2>
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        >
                            パスワードを変更する
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function MyPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MyPageContent />
        </Suspense>
    )
} 