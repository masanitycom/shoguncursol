"use client"

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            })

            if (error) throw error

            setSuccess(true)
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-4xl font-bold text-white mb-8">
                    パスワードリセット
                </h1>

                <div className="bg-gray-800/50 backdrop-blur-sm py-8 px-4 shadow-2xl rounded-xl sm:px-10 border border-gray-700">
                    {success ? (
                        <div className="text-center">
                            <p className="text-green-400 text-lg mb-4">
                                パスワードリセットのメールを送信しました。
                            </p>
                            <p className="text-gray-300">
                                メールの指示に従ってパスワードを再設定してください。
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
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
                                    {loading ? '送信中...' : 'リセットメールを送信'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <Link
                            href="/login"
                            className="text-lg font-medium text-blue-400 hover:text-blue-300
                                transition-colors duration-200"
                        >
                            ログイン画面に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
} 