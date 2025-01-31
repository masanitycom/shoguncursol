'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface NFTRate {
    name: string
    price: number
    daily_rate: number
    approved_at: string
}

export default function DailyRatesDisplay() {
    const [rates, setRates] = useState<NFTRate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDailyRates()
    }, [])

    const fetchDailyRates = async () => {
        try {
            // 現在のユーザーのセッションを取得
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // ユーザーの所有NFTを取得
            const { data: nfts, error: nftsError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    approved_at,
                    nfts:nft_id (
                        id,
                        name,
                        price,
                        daily_rate
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'approved')

            if (nftsError) throw nftsError

            // NFT毎の日利を計算
            const nftRates = nfts?.map(nft => ({
                name: nft.nfts.name,
                price: nft.nfts.price,
                daily_rate: nft.nfts.daily_rate * 100, // パーセント表示に変換（0.005 → 0.5%）
                approved_at: nft.approved_at
            })) || []

            setRates(nftRates)
        } catch (error) {
            console.error('Error fetching daily rates:', error)
            setError('日利の取得に失敗しました')
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
                            {item.name}
                        </h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-300">
                                日利: {item.daily_rate.toFixed(2)}%
                            </p>
                            <div className="flex items-baseline space-x-1">
                                <span className="text-sm text-gray-400">予想利益:</span>
                                <span className="text-2xl font-bold text-emerald-400">
                                    ${((item.price * item.daily_rate) / 100).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 