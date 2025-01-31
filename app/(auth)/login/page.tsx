"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// UserMetadataの型定義を更新
interface UserMetadata {
    user_id: string
    name_kana: string
    needs_password_reset?: boolean  // オプショナルプロパティとして追加
    // 他の必要なユーザーメタデータのフィールド
}

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<UserMetadata | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            // ユーザーが存在することを確認
            if (!data.user) {
                throw new Error('ユーザーが見つかりません')
            }

            // ここでユーザーが確実に存在する
            if (data.user.email === 'testadmin@gmail.com') {
                router.push('/admin/dashboard')
            } else {
                router.push('/dashboard')
            }

        } catch (error) {
            console.error('Login error:', error)
            setError(error instanceof Error ? error.message : 'ログインに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const getErrorMessage = (error: any) => {
        switch (error.message) {
            case 'Invalid login credentials':
                return 'メールアドレスまたはパスワードが正しくありません'
            case 'Email not confirmed':
                return 'メールアドレスの確認が完了していません'
            default:
                return 'ログインに失敗しました'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-white mb-8">
                    Shogun Trade
                </h1>
                
                <div className="bg-gray-800/50 backdrop-blur-sm py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-gray-700">
                    {error && (
                        <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-lg">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label 
                                htmlFor="email" 
                                className="block text-lg font-medium text-gray-200"
                            >
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-2 appearance-none block w-full px-3 py-4 border border-gray-600 rounded-lg 
                                    bg-gray-700/50 text-white placeholder-gray-400 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    text-lg shadow-sm"
                                placeholder="example@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-lg font-medium text-gray-200"
                            >
                                パスワード
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-2 appearance-none block w-full px-3 py-4 border border-gray-600 rounded-lg 
                                    bg-gray-700/50 text-white placeholder-gray-400 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    text-lg shadow-sm"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full flex justify-center py-4 px-4 rounded-lg text-lg font-medium text-white
                                    bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all duration-200 ease-in-out
                                    shadow-lg shadow-blue-500/30
                                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 space-y-4">
                        <div className="text-center">
                            <Link
                                href="/reset-password"
                                className="text-lg font-medium text-blue-400 hover:text-blue-300 
                                    transition-colors duration-200"
                            >
                                パスワードをお忘れの方
                            </Link>
                        </div>
                        <div className="text-center">
                            <Link
                                href="/signup"
                                className="text-lg font-medium text-blue-400 hover:text-blue-300
                                    transition-colors duration-200"
                            >
                                新規登録はこちら
                            </Link>
                        </div>
                    </div>

                    {user?.needs_password_reset && (
                        <div className="mt-4 p-4 bg-yellow-100 rounded">
                            <p className="text-yellow-800">
                                セキュリティのため、パスワードの設定が必要です。
                                <Link href="/reset-password" className="text-blue-600 hover:underline">
                                    こちらから設定してください
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}