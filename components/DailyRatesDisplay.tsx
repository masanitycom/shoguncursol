'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { NFTType, DailyRate } from '@/types/nft'

interface NFTWithRate {
    nft: NFTType
    dailyRate: number
    profitAmount: number
}

export default function DailyRatesDisplay() {
    const [rates, setRates] = useState<NFTWithRate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDailyRates()
    }, [])

    const fetchDailyRates = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            
            // まず、ユーザーの所有NFTを取得
            const { data: userNfts, error: nftError } = await supabase
                .from('user_nfts')
                .select(`
                    id,
                    nft:nft_id (
                        id,
                        name,
                        price,
                        daily_rate
                    )
                `)
                .eq('status', 'active')

            if (nftError) throw nftError

            // 本日の日利を取得
            const { data: dailyRates, error: rateError } = await supabase
                .from('daily_rates')
                .select('*')
                .eq('date', today)
                .in('nft_id', userNfts?.map(un => un.nft.id) || [])

            if (rateError) throw rateError

            // データを結合
            const nftRates = userNfts?.map(nft => {
                const todayRate = dailyRates?.find(dr => dr.nft_id === nft.nft.id)
                return {
                    nft: nft.nft,
                    dailyRate: todayRate?.rate || nft.nft.daily_rate, // 本日の日利がない場合はデフォルト値を使用
                    profitAmount: (nft.nft.price * (todayRate?.rate || nft.nft.daily_rate)) / 100
                }
            }) || []

            setRates(nftRates)
        } catch (err) {
            setError('日利の取得に失敗しました')
            console.error('Error fetching daily rates:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>読み込み中...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">本日の日利</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rates.map((item, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-all duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            {item.nft.name}
                        </h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-300">
                                日利: {item.dailyRate.toFixed(2)}%
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-sm text-gray-400">利益:</span>
                                <span className="text-2xl font-bold text-emerald-400">
                                    ${item.profitAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 