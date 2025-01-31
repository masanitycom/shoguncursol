'use client'

import { useState } from 'react'
import { RewardCalculator } from '@/lib/services/reward-calculator'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

export default function RewardCalculationPage() {
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const testCalculation = async () => {
        setLoading(true)
        try {
            // テスト用のデータ
            const testData = {
                investment: 1000,
                dailyRate: 0.5,
                days: 5,
                totalProfit: 1000000,
                sharingAmount: 200000
            }

            // 各種計算を実行
            const results = await RewardCalculator.calculateAll(testData)
            setResults(results)
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
                <main className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">報酬計算テスト</h1>

                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <button
                            onClick={testCalculation}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
                        >
                            {loading ? '計算中...' : '計算テスト実行'}
                        </button>

                        {results && (
                            <div className="mt-6 space-y-4">
                                <ResultCard title="日利計算結果" value={results.dailyReward} prefix="$" />
                                <ResultCard title="複利計算結果" value={results.compoundReward} prefix="$" />
                                <ResultCard title="分配金計算結果" value={results.profitShare} prefix="$" />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

function ResultCard({ title, value, prefix }: { title: string; value: number; prefix?: string }) {
    return (
        <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-gray-300 text-lg mb-2">{title}</h3>
            <p className="text-2xl font-bold text-white">
                {prefix}{value.toLocaleString()}
            </p>
        </div>
    )
} 