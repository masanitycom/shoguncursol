'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Header from '../../../../components/Header'
import AdminSidebar from '../../../../components/AdminSidebar'

interface NewUserForm {
    nameKana: string
    userId: string
    email: string
    password: string
    passwordConfirm: string
    referrerId: string
    usdtAddress?: string
    walletType: 'evocard' | 'other'
}

export default function NewUserPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<NewUserForm>({
        nameKana: '',
        userId: '',
        email: '',
        password: '',
        passwordConfirm: '',
        referrerId: '',
        usdtAddress: '',
        walletType: 'other'
    })

    useEffect(() => {
        checkAuth()
    }, [])

    const validateForm = (): string | null => {
        if (!formData.nameKana) return '名前（カタカナ）は必須です'
        if (!formData.userId) return 'ユーザーIDは必須です'
        if (!formData.email) return 'メールアドレスは必須です'
        if (!formData.password) return 'パスワードは必須です'
        if (!formData.passwordConfirm) return 'パスワード（確認）は必須です'
        if (formData.password !== formData.passwordConfirm) return 'パスワードが一致しません'
        if (!formData.referrerId) return '紹介者IDは必須です'
        
        // メールアドレスの形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) return 'メールアドレスの形式が正しくありません'

        // パスワードの強度チェック
        if (formData.password.length < 8) return 'パスワードは8文字以上必要です'

        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)

        try {
            // ユーザーを作成
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name_kana: formData.nameKana,
                        user_id: formData.userId,
                        referrer_id: formData.referrerId,
                        usdt_address: formData.usdtAddress || null,
                        wallet_type: formData.walletType
                    }
                }
            })

            if (authError) throw authError

            router.push('/admin/users')
        } catch (error: any) {
            console.error('Error creating user:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                router.push('/admin/login')
                return
            }
            setUser(session.user)
        } catch (error) {
            console.error('Auth error:', error)
            router.push('/admin/login')
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white">新規ユーザー登録</h3>
                        
                        <div className="mt-8">
                            <form onSubmit={handleSubmit} className="max-w-lg bg-gray-800 p-6 rounded-lg">
                                {error && (
                                    <div className="mb-4 text-red-500">{error}</div>
                                )}
                                
                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        名前（カタカナ） <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nameKana}
                                        onChange={(e) => setFormData({...formData, nameKana: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        ユーザーID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.userId}
                                        onChange={(e) => setFormData({...formData, userId: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        メールアドレス <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        パスワード <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        パスワード（確認） <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.passwordConfirm}
                                        onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        紹介者ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.referrerId}
                                        onChange={(e) => setFormData({...formData, referrerId: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-300 mb-2">
                                        USDTアドレス（BEP20）
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.usdtAddress}
                                        onChange={(e) => setFormData({...formData, usdtAddress: e.target.value})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-300 mb-2">
                                        ウォレットタイプ
                                    </label>
                                    <select
                                        value={formData.walletType}
                                        onChange={(e) => setFormData({...formData, walletType: e.target.value as 'evocard' | 'other'})}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                    >
                                        <option value="evocard">EVOカード</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? '登録中...' : '登録'}
                                </button>

                                <div className="mt-4 text-center">
                                    <a href="#" className="text-blue-400 hover:text-blue-300 text-sm">
                                        パスワードをお忘れですか？
                                    </a>
                                </div>

                                <div className="mt-2 text-gray-400 text-sm">
                                    <span className="text-red-500">*</span> は必須項目です
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 