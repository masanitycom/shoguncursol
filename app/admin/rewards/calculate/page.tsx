'use client'

import { useState } from 'react'
import { RewardCalculator } from '@/lib/services/reward-calculator'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

interface TestData {
    investment: number
    dailyRate: number
    days: number
    totalProfit: number
    sharingAmount: number
}

export default function RewardCalculationPage() {
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const testCalculation = async () => {
        setLoading(true)
        try {
            // テスト用のデータ
            const testData: TestData = {
                investment: 1000,
                dailyRate: 0.5,
                days: 5,
                totalProfit: 1000000,
                sharingAmount: 200000
            }

            // 個別の計算を実行
            const dailyReward = RewardCalculator.calculateDailyReward(
                testData.investment,
                testData.dailyRate
            )

            const compoundReward = RewardCalculator.calculateCompoundInterest(
                testData.investment,
                testData.dailyRate,
                testData.days
            )

            const profitShare = await RewardCalculator.calculateProfitSharing({
                totalProfit: testData.totalProfit,
                sharingAmount: testData.sharingAmount,
                weekStart: new Date(),
                weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            })

            setResults({
                dailyReward,
                compoundReward,
                profitShare
            })

        } catch (error) {
            console.error('Calculation error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={null} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">報酬計算テスト</h1>
                    
                    <button
                        onClick={testCalculation}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '計算中...' : '計算実行'}
                    </button>

                    {results && (
                        <div className="mt-6 space-y-4">
                            <ResultCard title="日利計算結果" value={results.dailyReward} prefix="$" />
                            <ResultCard title="複利計算結果" value={results.compoundReward} prefix="$" />
                            <ResultCard title="分配金計算結果" value={results.profitShare} prefix="$" />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

function ResultCard({ title, value, prefix = '' }: { title: string; value: number; prefix?: string }) {
    return (
        <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-gray-300 text-lg mb-2">{title}</h3>
            <p className="text-2xl font-bold text-white">
                {prefix}{value.toLocaleString()}
            </p>
        </div>
    )
} 