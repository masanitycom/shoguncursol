'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog } from '@headlessui/react'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'

interface UserProfile {
    id: string
    display_id: string
    email: string
    name: string | null
    wallet_type: string | null
    wallet_address: string | null
}

interface CustomWindow extends Window {
    open(url?: string | URL, target?: string, features?: string): Window | null;
}

interface Clipboard {
    writeText(text: string): Promise<void>;
}

interface CustomNavigator {
    clipboard: Clipboard;
}

declare const window: CustomWindow & typeof globalThis;
declare const navigator: CustomNavigator;

export default function ProfilePage() {
    const router = useRouter()
    const { user: authUser, loading: authLoading, handleLogout } = useAuth()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
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
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)

    useEffect(() => {
        checkAuth()
    }, [])

    useEffect(() => {
        const subscription = supabase
            .channel('profile_updates')
            .on('broadcast', { event: 'profile_updated' }, (payload) => {
                checkAuth(); // データを再取得
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            // 管理者のアクセスを制限
            if (session.user.email === 'testadmin@gmail.com') {
                router.push('/admin/dashboard')
                return
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
                return
            }

            const userData: UserProfile = {
                id: session.user.id,
                display_id: profile?.display_id || 'USER' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                email: session.user.email || '',
                name: profile?.name || null,
                wallet_type: profile?.wallet_type || null,
                wallet_address: profile?.wallet_address || null
            }

            // display_idが存在しない場合は作成
            if (!profile?.display_id) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ display_id: userData.display_id })
                    .eq('id', session.user.id)

                if (updateError) {
                    console.error('Error updating display_id:', updateError)
                }
            }

            setProfile(userData)
            setEditForm({
                name: userData.name || '',
                email: userData.email || '',
                wallet_address: userData.wallet_address || '',
                wallet_type: userData.wallet_type || 'EVOカード'
            })
        } catch (error) {
            console.error('Error checking auth:', error)
            setError('認証エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            // 1. メールアドレスの更新（必要な場合）
            if (editForm.email !== profile?.email) {
                const { error: authError } = await supabase.auth.updateUser({
                    email: editForm.email
                })
                if (authError) throw authError
            }

            // 2. 共通の更新データを作成
            const updateData = {
                name: editForm.name,
                email: editForm.email,
                wallet_address: editForm.wallet_address,
                wallet_type: editForm.wallet_type
            };

            // 3. プロフィールとユーザー情報を同時に更新
            const updates = [];

            // profiles テーブルの更新
            updates.push(
                supabase
                    .from('profiles')
                    .update(updateData)
                    .eq('id', profile?.id)
            );

            // users テーブルの更新
            updates.push(
                supabase
                    .from('users')
                    .update(updateData)
                    .eq('id', profile?.id)
            );

            // 4. 全ての更新を実行
            const results = await Promise.all(updates);

            // エラーチェック
            results.forEach((result, index) => {
                if (result.error) {
                    throw new Error(`Update failed for table ${index === 0 ? 'profiles' : 'users'}: ${result.error.message}`);
                }
            });

            // 5. リアルタイム更新のトリガー
            supabase
                .channel('profile_updates')
                .send({
                    type: 'broadcast',
                    event: 'profile_updated',
                    payload: { userId: profile?.id }
                });

            setSuccess('プロフィールを更新しました')
            checkAuth()
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

    const generateReferralUrl = useCallback((displayId: string) => {
        return `https://shogun-trade.com/signup?ref=${displayId}`
    }, [])

    // LINEでシェア
    const shareToLINE = () => {
        if (typeof window === 'undefined') return;

        const url = `https://line.me/R/msg/text/?${encodeURIComponent(
            `ShogunTradeSystemに参加しませんか？\n登録はこちら：${generateReferralUrl(profile?.display_id || '')}`
        )}`;
        window.open(url, '_blank');
    };

    const handleShare = () => {
        if (typeof window === 'undefined') return;

        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `ShogunTradeSystemに参加しませんか？\n登録はこちら：${generateReferralUrl(profile?.display_id || '')}`
        )}`;

        window.open(url, '_blank');
    };

    const handleCopyId = async () => {
        if (typeof window === 'undefined') return;
        
        try {
            await navigator.clipboard.writeText(profile?.display_id || '');
            setSuccess('IDをコピーしました');
        } catch (error) {
            setError('IDのコピーに失敗しました');
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header
                user={authUser}
                onLogout={handleLogout}
                profile={profile ? {
                    name: profile.name,
                    email: profile.email
                } : undefined}
                isAdmin={false}
            />
            <main className="container mx-auto px-4 py-8">
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
                                                <p className="text-white font-medium">{profile?.display_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">名前</p>
                                                <p className="text-white font-medium">{profile?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">メールアドレス</p>
                                                <p className="text-white font-medium">{profile?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">ウォレットアドレス</p>
                                                <p className="text-white font-medium">{profile?.wallet_address}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">ウォレットの種類</p>
                                                <p className="text-white font-medium">{profile?.wallet_type}</p>
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
                                <h3 className="text-xl font-bold text-white mb-4">紹介情報</h3>
                                <div className="space-y-6">
                                    {/* 紹介コード */}
                                    <div>
                                        <p className="text-gray-400 mb-2">あなたのID</p>
                                        <div className="flex items-center space-x-4">
                                            <p className="text-xl font-mono text-white bg-gray-800 px-4 py-2 rounded">
                                                {profile?.display_id}
                                            </p>
                                            <button
                                                onClick={handleCopyId}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                                            >
                                                IDをコピー
                                            </button>
                                        </div>
                                    </div>

                                    {/* 紹介URL */}
                                    <div className="mt-8 bg-gray-800 p-6 rounded-lg">
                                        <h2 className="text-xl font-bold text-white mb-4">紹介URL</h2>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="text"
                                                value={generateReferralUrl(profile.display_id)}
                                                readOnly
                                                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded"
                                            />
                                            <button
                                                onClick={() => {
                                                    if (profile) {
                                                        navigator.clipboard.writeText(generateReferralUrl(profile.display_id))
                                                    }
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                            >
                                                コピー
                                            </button>
                                        </div>
                                    </div>

                                    {/* QRコード */}
                                    <div>
                                        <p className="text-gray-400 mb-2">紹介用QRコード</p>
                                        <div className="flex flex-col items-center space-y-4">
                                            <div 
                                                className="bg-white p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsQRModalOpen(true)}
                                            >
                                                <QRCodeSVG 
                                                    value={generateReferralUrl(profile.display_id)}
                                                    size={200}
                                                    level="H"
                                                    includeMargin
                                                />
                                            </div>
                                            <p className="text-gray-400 text-sm">
                                                タップして拡大表示
                                            </p>
                                        </div>
                                    </div>

                                    {/* LINEで共有ボタン */}
                                    <div>
                                        <button
                                            onClick={shareToLINE}
                                            className="flex items-center justify-center space-x-2 w-full bg-[#00B900] text-white px-4 py-3 rounded-lg hover:bg-[#009900] transition-colors"
                                        >
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M19.365 9.863c.349 0 .63.285.631.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                                            </svg>
                                            <span>LINEで送る</span>
                                        </button>
                                    </div>

                                    <div className="text-gray-400 text-sm space-y-2">
                                        <p>※ このコードを共有して新規メンバーを紹介できます</p>
                                        <p>※ 紹介したメンバーが登録すると、特別なボーナスを獲得できます</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QRコードモーダル */}
                <Dialog
                    open={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    className="relative z-50"
                >
                    <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="bg-white rounded-lg p-8">
                            <QRCodeSVG 
                                value={generateReferralUrl(profile.display_id)}
                                size={300}
                                level="H"
                                includeMargin
                            />
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </main>
        </div>
    )
} 