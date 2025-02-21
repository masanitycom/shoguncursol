'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { message, Modal, Button, Popconfirm } from 'antd'
import { useAuth } from '@/lib/auth'
import { WeeklyProfitSummary, RankLevel, RankDistribution, CONQUEST_BONUS_RATES } from '@/types/reward'
import { WeeklyProfitRecord, BonusDistribution } from '@/types/profit'
import { deleteWeeklyProfit } from '@/lib/services/profit'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import EditProfitModal from '../components/EditProfitModal'

export default function WeeklyProfitSummaryPage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(true)
    const [summaries, setSummaries] = useState<WeeklyProfitSummary[]>([])
    const [selectedProfit, setSelectedProfit] = useState<WeeklyProfitRecord | null>(null)
    const [isEditModalVisible, setIsEditModalVisible] = useState(false)

    useEffect(() => {
        if (user) {
            fetchSummaries()
        }
    }, [user])

    const fetchSummaries = async () => {
        try {
            // 1. 週次利益データを取得
            const { data: weeklyProfits, error: profitsError } = await supabase
                .from('weekly_profits')
                .select('*')
                .order('week_start', { ascending: false })

            if (profitsError) throw profitsError

            // 2. 各週のボーナス分配データを取得
            const summaryPromises = weeklyProfits.map(async (profit) => {
                const { data: bonuses, error: bonusesError } = await supabase
                    .from('conquest_bonuses')
                    .select('*')
                    .eq('weekly_profit_id', profit.id)

                if (bonusesError) throw bonusesError

                // ランクごとの集計
                const distributions = bonuses.reduce((acc, bonus) => {
                    const rank = bonus.rank as RankLevel
                    if (!acc[rank]) {
                        acc[rank] = {
                            rank,
                            userCount: 0,
                            totalAmount: 0,
                            perUserAmount: bonus.amount
                        }
                    }
                    acc[rank].userCount++
                    acc[rank].totalAmount += bonus.amount
                    return acc
                }, {} as Record<RankLevel, RankDistribution>)

                return {
                    weeklyProfit: {
                        id: profit.id,
                        week_start: profit.week_start,
                        week_end: profit.week_end,
                        total_profit: profit.total_profit,
                        share_rate: profit.share_rate,
                        distribution_amount: profit.distribution_amount,
                        created_at: profit.created_at
                    },
                    distributions: Object.values(distributions),
                    totalUsers: bonuses.length
                } as WeeklyProfitSummary
            })

            const summaryResults = await Promise.all(summaryPromises)
            setSummaries(summaryResults)
        } catch (error) {
            console.error('Error fetching summaries:', error)
            message.error('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ja-JP')
    }

    const formatMoney = (amount: number) => {
        return `$${amount.toLocaleString()}`
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await deleteWeeklyProfit(id)
            if (result.success) {
                message.success('週次利益を削除しました')
                fetchSummaries()
            } else {
                throw result.error
            }
        } catch (error) {
            console.error('Error deleting weekly profit:', error)
            message.error('削除に失敗しました')
        }
    }

    const handleEdit = (weeklyProfit: any) => {
        setSelectedProfit({
            id: weeklyProfit.id,
            week_start: weeklyProfit.week_start,
            week_end: weeklyProfit.week_end,
            total_profit: weeklyProfit.total_profit,
            share_rate: weeklyProfit.share_rate,
            distribution_amount: weeklyProfit.distribution_amount,
            created_at: weeklyProfit.created_at
        })
        setIsEditModalVisible(true)
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <h1 className="text-2xl font-bold text-white mb-6">週次利益サマリー</h1>

                    {loading ? (
                        <div className="text-white text-center">Loading...</div>
                    ) : summaries.length > 0 ? (
                        <div className="space-y-6">
                            {summaries.map((summary) => (
                                <div key={summary.weeklyProfit.id} className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h2 className="text-xl text-white">
                                                {formatDate(summary.weeklyProfit.week_start)} 〜{' '}
                                                {formatDate(summary.weeklyProfit.week_end)}
                                            </h2>
                                            <p className="text-gray-400">
                                                総利益: {formatMoney(summary.weeklyProfit.total_profit)} / 
                                                分配総額: {formatMoney(summary.weeklyProfit.distribution_amount)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                icon={<EditOutlined />}
                                                onClick={() => handleEdit(summary.weeklyProfit)}
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                編集
                                            </Button>
                                            <Popconfirm
                                                title="この週次利益を削除しますか？"
                                                description="関連する天下統一ボーナスも削除されます"
                                                onConfirm={() => handleDelete(summary.weeklyProfit.id)}
                                                okText="削除"
                                                cancelText="キャンセル"
                                            >
                                                <Button
                                                    icon={<DeleteOutlined />}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    削除
                                                </Button>
                                            </Popconfirm>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <table className="min-w-full divide-y divide-gray-700">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-sm text-gray-300">ランク</th>
                                                    <th className="px-4 py-2 text-left text-sm text-gray-300">対象者数</th>
                                                    <th className="px-4 py-2 text-left text-sm text-gray-300">1人あたり</th>
                                                    <th className="px-4 py-2 text-left text-sm text-gray-300">合計</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700">
                                                {summary.distributions.map((dist) => (
                                                    <tr key={dist.rank}>
                                                        <td className="px-4 py-2 text-white">{dist.rank}</td>
                                                        <td className="px-4 py-2 text-white">{dist.userCount}人</td>
                                                        <td className="px-4 py-2 text-white">{formatMoney(dist.perUserAmount)}</td>
                                                        <td className="px-4 py-2 text-white">{formatMoney(dist.totalAmount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            データがありません
                        </div>
                    )}
                </main>
            </div>

            <EditProfitModal
                profit={selectedProfit}
                isVisible={isEditModalVisible}
                onClose={() => {
                    setIsEditModalVisible(false)
                    setSelectedProfit(null)
                }}
                onSuccess={fetchSummaries}
            />
        </div>
    )
} 