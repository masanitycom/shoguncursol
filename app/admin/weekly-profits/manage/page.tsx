'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { formatPrice } from '@/lib/utils'
import { message, Modal } from 'antd'
import { WeeklyProfit } from '@/types/reward'

export default function WeeklyProfitsManage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [profits, setProfits] = useState<WeeklyProfit[]>([])
    const [loading, setLoading] = useState(true)
    const [editingProfit, setEditingProfit] = useState<WeeklyProfit | null>(null)

    useEffect(() => {
        fetchProfits()
    }, [])

    const fetchProfits = async () => {
        try {
            const { data, error } = await supabase
                .from('weekly_profits')
                .select('*')
                .order('week_start', { ascending: false })

            if (error) throw error
            setProfits(data)
        } catch (error) {
            console.error('Error:', error)
            message.error('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (profit: WeeklyProfit) => {
        setEditingProfit(profit)
    }

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: '削除の確認',
            content: 'この記録を削除してもよろしいですか？',
            okText: '削除',
            okType: 'danger',
            cancelText: 'キャンセル',
            onOk: async () => {
                try {
                    const { error } = await supabase
                        .from('weekly_profits')
                        .delete()
                        .eq('id', id)

                    if (error) throw error

                    message.success('削除しました')
                    fetchProfits()
                } catch (error) {
                    console.error('Error:', error)
                    message.error('削除に失敗しました')
                }
            }
        })
    }

    const handleSaveEdit = async () => {
        if (!editingProfit) return

        try {
            const { error } = await supabase
                .from('weekly_profits')
                .update({
                    week_start: editingProfit.week_start,
                    week_end: editingProfit.week_end,
                    total_profit: editingProfit.total_profit,
                    share_rate: editingProfit.share_rate,
                    distribution_amount: editingProfit.distribution_amount
                })
                .eq('id', editingProfit.id)

            if (error) throw error

            message.success('更新しました')
            setEditingProfit(null)
            fetchProfits()
        } catch (error) {
            console.error('Error:', error)
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
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">天下統一ボーナス管理</h1>

                        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-gray-300">期間</th>
                                        <th className="px-4 py-3 text-right text-gray-300">会社利益</th>
                                        <th className="px-4 py-3 text-center text-gray-300">分配率</th>
                                        <th className="px-4 py-3 text-right text-gray-300">分配総額</th>
                                        <th className="px-4 py-3 text-center text-gray-300">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {profits.map(profit => (
                                        <tr key={profit.id} className="hover:bg-gray-750">
                                            <td className="px-4 py-3 text-gray-300">
                                                {new Date(profit.week_start).toLocaleDateString()} - 
                                                {new Date(profit.week_end).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300">
                                                ${formatPrice(profit.total_profit)}
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-300">
                                                {profit.share_rate}%
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300">
                                                ${formatPrice(profit.distribution_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleEdit(profit)}
                                                    className="text-blue-400 hover:text-blue-300 mx-2"
                                                >
                                                    編集
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profit.id)}
                                                    className="text-red-400 hover:text-red-300 mx-2"
                                                >
                                                    削除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* 編集モーダル */}
            <Modal
                title="ボーナス情報の編集"
                open={!!editingProfit}
                onOk={handleSaveEdit}
                onCancel={() => setEditingProfit(null)}
                okText="保存"
                cancelText="キャンセル"
            >
                {editingProfit && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">開始日</label>
                            <input
                                type="date"
                                value={new Date(editingProfit.week_start).toISOString().split('T')[0]}
                                onChange={e => setEditingProfit({
                                    ...editingProfit,
                                    week_start: e.target.value
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">終了日</label>
                            <input
                                type="date"
                                value={new Date(editingProfit.week_end).toISOString().split('T')[0]}
                                onChange={e => setEditingProfit({
                                    ...editingProfit,
                                    week_end: e.target.value
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">会社利益</label>
                            <input
                                type="number"
                                value={editingProfit.total_profit}
                                onChange={e => setEditingProfit({
                                    ...editingProfit,
                                    total_profit: Number(e.target.value)
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">分配率 (%)</label>
                            <select
                                value={editingProfit.share_rate}
                                onChange={e => setEditingProfit({
                                    ...editingProfit,
                                    share_rate: Number(e.target.value)
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            >
                                <option value={20}>20%</option>
                                <option value={22}>22%</option>
                                <option value={25}>25%</option>
                                <option value={30}>30%</option>
                            </select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
} 