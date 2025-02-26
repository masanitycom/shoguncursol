'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { calculateWeeklyProfitPreview, registerWeeklyProfit } from '@/lib/services/weekly-profit'
import { WeeklyProfitPreview } from '@/types/reward'
import { formatPrice } from '@/lib/utils'
import { message } from 'antd'
import { 
    LEVEL_ORDER, 
    LEVEL_REQUIREMENTS, 
    CONQUEST_BONUS_RATES,
    LEVEL_NAMES
} from '@/lib/services/weekly-profit'

interface LevelData {
    level: string;
    userCount: number;
    amount: number;
    perUser: number;
}

export default function WeeklyProfitRegister() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<WeeklyProfitPreview | null>(null)

    // フォームの状態
    const [formData, setFormData] = useState({
        companyProfit: 0,
        distributionRate: 20,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })

    // 入力値が変更されるたびにプレビューを更新
    useEffect(() => {
        if (formData.companyProfit > 0) {
            calculatePreview()
        }
    }, [formData])

    const calculatePreview = async () => {
        try {
            setLoading(true)
            const result = await calculateWeeklyProfitPreview(
                new Date(formData.startDate),
                new Date(formData.endDate),
                formData.companyProfit,
                formData.distributionRate
            )
            setPreview(result)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'companyProfit' ? Number(value) : value
        }))
    }

    const handleRegister = async () => {
        try {
            if (!preview) return;

            setLoading(true)
            const result = await registerWeeklyProfit(preview)

            if (result.success) {
                message.success('登録が完了しました')
                router.push('/admin/weekly-profits/manage')
            }
        } catch (error) {
            console.error('Error:', error)
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
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">天下統一ボーナス設定</h1>

                        <div className="bg-gray-800 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        開始日
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        終了日
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        会社の総利益
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            name="companyProfit"
                                            value={formData.companyProfit}
                                            onChange={handleInputChange}
                                            className="w-full bg-gray-700 text-white rounded-lg pl-8 pr-4 py-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        分配率
                                    </label>
                                    <select
                                        name="distributionRate"
                                        value={formData.distributionRate}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2"
                                    >
                                        <option value={20}>20%</option>
                                        <option value={22}>22%</option>
                                        <option value={25}>25%</option>
                                        <option value={30}>30%</option>
                                    </select>
                                </div>
                            </div>

                            {preview && (
                                <div className="mt-6 space-y-4 bg-white rounded-lg p-4">
                                    {/* 分配原資の表示 */}
                                    <div className="flex items-baseline justify-between border-b pb-3">
                                        <div className="text-base text-gray-600">分配原資</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            ${formatPrice(preview.distributions.unificationBonus.total)}
                                            <span className="text-sm text-gray-500 ml-2">
                                                (${formatPrice(formData.companyProfit)} × {formData.distributionRate}%)
                                            </span>
                                        </div>
                                    </div>

                                    {/* レベル別分配テーブル */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 border-b">
                                                    <th className="px-3 py-2 text-left text-gray-600">レベル</th>
                                                    <th className="px-3 py-2 text-center text-gray-600">分配率</th>
                                                    <th className="px-3 py-2 text-center text-gray-600">ユーザー数</th>
                                                    <th className="px-3 py-2 text-right text-gray-600">1人あたり</th>
                                                    <th className="px-3 py-2 text-right text-gray-600">総支給額</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {LEVEL_ORDER.map((levelKey, index) => {
                                                    const levelData = preview.distributions.unificationBonus.byLevel
                                                        .find(l => l.level === levelKey) as LevelData | undefined;
                                                    const hasUsers = (levelData?.userCount ?? 0) > 0;
                                                    
                                                    return (
                                                        <tr key={levelKey} 
                                                            className={`
                                                                border-b
                                                                ${hasUsers ? 'bg-blue-50' : 'bg-white'}
                                                            `}
                                                        >
                                                            <td className="px-3 py-2 text-gray-900">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className={`
                                                                        w-2 h-2 rounded-full
                                                                        ${hasUsers ? 'bg-blue-500' : 'bg-gray-300'}
                                                                    `}></span>
                                                                    <span>{LEVEL_NAMES[levelKey]}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <span className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                                                                    {CONQUEST_BONUS_RATES[levelKey]}%
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-center text-gray-900">
                                                                {levelData?.userCount || 0}
                                                                <span className="text-gray-500 ml-1">人</span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-gray-900">
                                                                ${formatPrice(levelData?.perUser || 0)}
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-gray-900">
                                                                ${formatPrice(levelData?.amount || 0)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50 font-bold">
                                                    <td colSpan={4} className="px-3 py-2 text-gray-900">合計</td>
                                                    <td className="px-3 py-2 text-right text-gray-900">
                                                        ${formatPrice(preview.distributions.unificationBonus.total)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* 登録ボタン */}
                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleRegister}
                                            disabled={loading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded 
                                                     hover:bg-blue-500 transition-colors
                                                     disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {loading ? '登録中...' : '登録する'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 