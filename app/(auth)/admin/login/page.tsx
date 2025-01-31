"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            console.log('Attempting admin login with:', email) // デバッグ用

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            console.log('Login response:', { data, error }) // デバッグ用

            if (error) throw error

            if (email !== 'testadmin@gmail.com') {
                throw new Error('管理者アカウントではありません')
            }

            router.push('/admin/dashboard')
        } catch (error: any) {
            console.error('Login error:', error) // デバッグ用
            setError(
                error.message === 'Invalid login credentials'
                    ? 'メールアドレスまたはパスワードが正しくありません'
                    : error.message
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-white mb-8">
                    管理者ログイン
                </h1>

                <div className="bg-gray-800/50 backdrop-blur-sm py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-gray-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-lg">
                                <p className="text-red-200">{error}</p>
                            </div>
                        )}

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
                                className="w-full flex justify-center py-4 px-4 rounded-lg text-lg font-medium text-white
                                    bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    transition-all duration-200 ease-in-out
                                    shadow-lg shadow-blue-500/30"
                            >
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}