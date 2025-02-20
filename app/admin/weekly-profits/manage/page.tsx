'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { message } from 'antd'
import { useAuth } from '@/lib/auth'

interface WeeklyProfit {
    id: string;
    week_start: string;
    week_end: string;
    total_profit: number;
    distribution_amount: number;
    distributed: boolean;
    created_at: string;
}

export default function WeeklyProfitsManagePage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(true)
    const [weeklyProfits, setWeeklyProfits] = useState<WeeklyProfit[]>([])

    useEffect(() => {
        if (user) {
            fetchWeeklyProfits()
        }
    }, [user])

    const fetchWeeklyProfits = async () => {
        try {
            const { data, error } = await supabase
                .from('weekly_profits')
                .select('*')
                .order('week_start', { ascending: false })

            if (error) throw error

            setWeeklyProfits(data || [])
        } catch (error) {
            console.error('Error fetching weekly profits:', error)
            message.error('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDistribute = async (id: string) => {
        try {
            const { error } = await supabase
                .from('weekly_profits')
                .update({ distributed: true })
                .eq('id', id)

            if (error) throw error

            message.success('分配を完了としてマークしました')
            fetchWeeklyProfits()
        } catch (error) {
            console.error('Error marking as distributed:', error)
            message.error('更新に失敗しました')
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-white">週次利益管理</h1>
                        <button
                            onClick={() => router.push('/admin/weekly-profits/register')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
                        >
                            新規登録
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-white text-center">Loading...</div>
                    ) : weeklyProfits.length > 0 ? (
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            期間
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            総利益
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            分配額
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            ステータス
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                            アクション
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {weeklyProfits.map((profit) => (
                                        <tr key={profit.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                                {new Date(profit.week_start).toLocaleDateString()} 〜{' '}
                                                {new Date(profit.week_end).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                                ${profit.total_profit.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                                ${profit.distribution_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        profit.distributed
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                                >
                                                    {profit.distributed ? '分配済み' : '未分配'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {!profit.distributed && (
                                                    <button
                                                        onClick={() => handleDistribute(profit.id)}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        分配完了にする
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            データがありません
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
} 