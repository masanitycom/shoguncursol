'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

interface WeeklyProfitData {
    week_start: string
    week_end: string
    profit_amount: number
    distribution_amount: number
    distributed_amount: number
    undistributed_amount: number
    status: 'pending' | 'completed'
}

export default function WeeklyProfitsPage() {
    const [user, setUser] = useState<any>(null)
    const [weeklyProfit, setWeeklyProfit] = useState<number>(0)
    const [weekStart, setWeekStart] = useState<string>('')
    const [weekEnd, setWeekEnd] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // 認証チェック
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                    window.location.replace('/admin/login')
                    return
                }
                
                setUser(session.user)
            } catch (error) {
                console.error('Auth check error:', error)
                window.location.replace('/admin/login')
            }
        }

        checkAuth()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const distributionAmount = weeklyProfit * 0.2 // 20%を分配用に確保

            const { error } = await supabase
                .from('weekly_company_profits')
                .insert([{
                    week_start: weekStart,
                    week_end: weekEnd,
                    profit_amount: weeklyProfit,
                    distribution_amount: distributionAmount,
                    distributed_amount: 0,
                    undistributed_amount: distributionAmount,
                    status: 'pending'
                }])

            if (error) throw error
            
            setMessage({ type: 'success', text: '週次利益が正常に登録されました' })
            // フォームをリセット
            setWeeklyProfit(0)
            setWeekStart('')
            setWeekEnd('')
        } catch (error) {
            console.error('Error:', error)
            setMessage({ type: 'error', text: '登録に失敗しました' })
        } finally {
            setLoading(false)
        }
    }

    // ログアウト処理
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            // リダイレクトはhandleAuthStateChangeで処理されるため、ここでは何もしない
        } catch (error) {
            console.error('Logout error:', error)
            window.location.replace('/admin/login')
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white mb-8">週次利益登録</h3>
                        
                        <div className="bg-gray-800 rounded-lg p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        週の開始日
                                    </label>
                                    <input
                                        type="date"
                                        value={weekStart}
                                        onChange={(e) => setWeekStart(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        週の終了日
                                    </label>
                                    <input
                                        type="date"
                                        value={weekEnd}
                                        onChange={(e) => setWeekEnd(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        週次利益 ($)
                                    </label>
                                    <input
                                        type="number"
                                        value={weeklyProfit}
                                        onChange={(e) => setWeeklyProfit(Number(e.target.value))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-lg ${
                                        message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                                    }`}>
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
                                >
                                    {loading ? '登録中...' : '利益を登録'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 