'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { message } from 'antd'
import { useAuth } from '@/lib/auth'

interface WeeklyProfitForm {
    weekStart: string;
    weekEnd: string;
    totalProfit: number;
    profitShareRate: 20 | 22 | 25 | 30;
    note?: string;
}

export default function WeeklyProfitRegisterPage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<WeeklyProfitForm>({
        weekStart: '',
        weekEnd: '',
        totalProfit: 0,
        profitShareRate: 20
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const distributionAmount = formData.totalProfit * (formData.profitShareRate / 100)

            const { data: weeklyProfit, error: weeklyProfitError } = await supabase
                .from('weekly_profits')
                .insert({
                    week_start: formData.weekStart,
                    week_end: formData.weekEnd,
                    total_profit: formData.totalProfit,
                    distribution_amount: distributionAmount,
                    distributed: false
                })
                .select()
                .single()

            if (weeklyProfitError) throw weeklyProfitError

            message.success('週次利益を登録しました')
            router.push('/admin/weekly-profits/manage')

        } catch (error) {
            console.error('Error registering weekly profit:', error)
            message.error('登録に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <h1 className="text-2xl font-bold text-white mb-6">週次利益登録</h1>

                    <form onSubmit={handleSubmit} className="max-w-2xl bg-gray-800 rounded-lg p-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        開始日
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.weekStart}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            weekStart: e.target.value
                                        })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        終了日
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.weekEnd}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            weekEnd: e.target.value
                                        })}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    総利益額（USD）
                                </label>
                                <input
                                    type="number"
                                    value={formData.totalProfit}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        totalProfit: Number(e.target.value)
                                    })}
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    利益分配率（%）
                                </label>
                                <select
                                    value={formData.profitShareRate}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        profitShareRate: Number(e.target.value) as 20 | 22 | 25 | 30
                                    })}
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                >
                                    <option value={20}>20%</option>
                                    <option value={22}>22%</option>
                                    <option value={25}>25%</option>
                                    <option value={30}>30%</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    備考
                                </label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        note: e.target.value
                                    })}
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 h-24"
                                    placeholder="備考があれば入力してください"
                                />
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`
                                        px-6 py-2 bg-blue-600 text-white rounded-lg
                                        hover:bg-blue-500 transition-colors
                                        disabled:bg-blue-800 disabled:cursor-not-allowed
                                    `}
                                >
                                    {loading ? '登録中...' : '登録する'}
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    )
} 