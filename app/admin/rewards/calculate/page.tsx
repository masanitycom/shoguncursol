'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RewardCalculator } from '@/lib/services/reward-calculator';
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import type { NFTType } from '@/types/nft'
import { useAuth } from '@/lib/auth'

interface TestData {
    investment: number
    purchaseDate: Date
    dailyRate: number
    days: number
    totalProfit: number
    sharingAmount: number
}

export default function CalculateRewardsPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const calculateRewards = async () => {
        setLoading(true)
        try {
            const testData: TestData = {
                investment: 1000,
                purchaseDate: new Date('2024-01-01'),
                dailyRate: 0.01,    // 1%
                days: 5,            // 5営業日
                totalProfit: 1000000,
                sharingAmount: 200000
            }

            // NFTTypeに変換
            const nftData: NFTType = {
                id: 'test-nft-1',
                price: testData.investment,
                name: 'SHOGUN NFT1000',
                maxDailyRate: 1.0,
                currentDailyRate: testData.dailyRate,
                isLegacy: false
            }

            // 個別の計算を実行
            const dailyReward = RewardCalculator.calculateDailyReward(nftData)

            const compoundReward = RewardCalculator.calculateCompoundInterest(
                testData.investment,
                nftData.currentDailyRate,
                5 // 営業日数
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
            console.error('Error calculating rewards:', error)
            setError('報酬の計算に失敗しました')
        } finally {
            setLoading(false)
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
                <main className="flex-1 p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">報酬計算テスト</h1>
                    
                    <button
                        onClick={calculateRewards}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? '計算中...' : '計算実行'}
                    </button>

                    {error && (
                        <div className="mt-6 text-red-500">
                            {error}
                        </div>
                    )}

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