'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'
import { UserProfile } from '@/types/user'

function MyPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading, handleLogout } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
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

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    name,
                    name_kana,
                    wallet_type,
                    wallet_address,
                    investment_amount,
                    total_team_investment,
                    max_line_investment,
                    other_lines_investment,
                    active,
                    created_at,
                    updated_at,
                    display_id
                `)
                .eq('id', session.user.id)
                .single()

            if (profileError && profileError.code !== 'PGRST116') throw profileError

            const userData: UserProfile = {
                id: session.user.id,
                user_id: session.user.id,
                email: session.user.email || '',
                name: profileData?.name || '',
                name_kana: profileData?.name_kana || '',
                wallet_address: profileData?.wallet_address || null,
                wallet_type: profileData?.wallet_type || null,
                investment_amount: Number(profileData?.investment_amount) || 0,
                total_team_investment: Number(profileData?.total_team_investment) || 0,
                max_line_investment: Number(profileData?.max_line_investment) || 0,
                other_lines_investment: Number(profileData?.other_lines_investment) || 0,
                active: profileData?.active ?? true,
                created_at: profileData?.created_at || new Date().toISOString(),
                updated_at: profileData?.updated_at || new Date().toISOString(),
                display_id: profileData?.display_id || session.user.id.slice(0, 8),
                children: []
            }

            setProfile(userData)
            setFormData({
                email: userData.email,
                name: userData.name || '',
                wallet_type: userData.wallet_type || '',
                wallet_address: userData.wallet_address || ''
            })
        } catch (error: any) {
            console.error('Error fetching user:', error)
            setError(error.message)
        }
    }

    const handleUpdate = async () => {
        if (loading) return
        setError(null)

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: profile?.id,
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
        }
    }

    const handlePasswordUpdate = async () => {
        if (passwordData.password !== passwordData.confirmPassword) {
            setError('パスワードが一致しません')
            return
        }

        if (loading) return
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
        }
    }

    if (!profile) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                user={user}
                onLogout={handleLogout}
                profile={profile ? {
                    name: profile.name,
                    email: profile.email
                } : undefined}
                isAdmin={false}
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
                                    <p className="text-white font-mono">{profile.id}</p>
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
                                    <span className="text-white font-mono">{profile.id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-400">メールアドレス</span>
                                    <span className="text-white">{profile.email}</span>
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