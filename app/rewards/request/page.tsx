'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'

interface RewardRequestForm {
    amount: number
    usdt_address: string
    wallet_type: 'EVO' | 'その他'
}

interface UserProfile {
    id: string
    wallet_address: string
    wallet_type: string
}

export default function RewardRequestPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<RewardRequestForm>({
        amount: 0,
        usdt_address: '',
        wallet_type: 'その他'
    })

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        setUser(session.user)
        
        // USDTアドレスとウォレットタイプを取得
        const { data: userData } = await supabase
            .from('users')
            .select('usdt_address, wallet_type')
            .eq('id', session.user.id)
            .single()

        if (userData) {
            setFormData(prev => ({
                ...prev,
                usdt_address: userData.usdt_address || '',
                wallet_type: userData.wallet_type || 'その他'
            }))
        }
    }

    const calculateFee = (amount: number, walletType: 'EVO' | 'その他') => {
        const feePercentage = walletType === 'EVO' ? 0.055 : 0.08
        return amount * feePercentage
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const feeAmount = calculateFee(formData.amount, formData.wallet_type)

            const { error: requestError } = await supabase
                .from('reward_requests')
                .insert({
                    user_id: user.id,
                    user_name: user.user_metadata?.name_kana || user.email,
                    request_amount: formData.amount,
                    fee_amount: feeAmount,
                    usdt_address: formData.usdt_address,
                    wallet_type: formData.wallet_type
                })

            if (requestError) throw requestError

            router.push('/rewards/history')
        } catch (error: any) {
            console.error('Error submitting request:', error)
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
                <div className="max-w-lg mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">報酬申請</h1>

                    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg">
                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">
                                申請金額（USDT）
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                required
                            />
                            <div className="mt-1 text-sm text-gray-400">
                                手数料: {(formData.wallet_type === 'EVO' ? '5.5' : '8')}%
                                （${calculateFee(formData.amount, formData.wallet_type).toFixed(2)}）
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">
                                USDTアドレス（BEP20）
                            </label>
                            <input
                                type="text"
                                value={formData.usdt_address}
                                onChange={(e) => setFormData({...formData, usdt_address: e.target.value})}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">
                                ウォレットタイプ
                            </label>
                            <select
                                value={formData.wallet_type}
                                onChange={(e) => setFormData({...formData, wallet_type: e.target.value as 'EVO' | 'その他'})}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                            >
                                <option value="EVO">EVOカード</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '申請中...' : '申請する'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
} 