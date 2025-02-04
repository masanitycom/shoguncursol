'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'

interface RewardHistory {
    id: string
    request_amount: number
    fee_amount: number
    request_date: string
    status: '保留中' | '送金済' | '拒否'
    usdt_address: string
    wallet_type: 'EVO' | 'その他'
}

export default function RewardHistoryPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [history, setHistory] = useState<RewardHistory[]>([])
    const [loading, setLoading] = useState(true)

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
        await fetchHistory(session.user.id)
    }

    const fetchHistory = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('reward_requests')
                .select('*')
                .eq('user_id', userId)
                .order('request_date', { ascending: false })

            if (error) throw error
            setHistory(data || [])
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case '送金済':
                return 'bg-green-900 text-green-300'
            case '拒否':
                return 'bg-red-900 text-red-300'
            default:
                return 'bg-yellow-900 text-yellow-300'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                onLogout={handleLogout}
            />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">報酬履歴</h1>

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-gray-700">
                                <th className="px-6 py-3 text-left text-white">申請日</th>
                                <th className="px-6 py-3 text-left text-white">申請額</th>
                                <th className="px-6 py-3 text-left text-white">手数料</th>
                                <th className="px-6 py-3 text-left text-white">実受取額</th>
                                <th className="px-6 py-3 text-left text-white">ウォレット</th>
                                <th className="px-6 py-3 text-left text-white">状態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {history.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-750">
                                    <td className="px-6 py-4 text-white">
                                        {new Date(item.request_date).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        ${item.request_amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-red-400">
                                        -${item.fee_amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-green-400">
                                        ${(item.request_amount - item.fee_amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.wallet_type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${getStatusStyle(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {history.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            報酬申請履歴はありません
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
} 