'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface DailyRate {
    date: string
    rate: number
}

export default function DailyRatesDisplay() {
    const [rates, setRates] = useState<DailyRate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDailyRates = async () => {
            try {
                const { data: nftSettings, error } = await supabase
                    .from('nft_settings')
                    .select('name, price, daily_rate')
                    .order('price', { ascending: true })

                if (error) throw error

                const rates = nftSettings.map(nft => ({
                    date: new Date().toISOString().split('T')[0],
                    rate: parseFloat(nft.daily_rate || '1.0')
                }))

                setRates(rates)
                setLoading(false)
            } catch (error) {
                console.error('Error fetching daily rates:', error)
                setError('日利の取得に失敗しました')
                setLoading(false)
            }
        }

        fetchDailyRates()
    }, [])

    if (loading) return <div className="text-gray-400">Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">直近7日間の日利</h3>
            <div className="space-y-2">
                {rates.map((rate, index) => (
                    <div key={`${rate.date}-${index}`} className="flex justify-between text-gray-300">
                        <span>{new Date(rate.date).toLocaleDateString('ja-JP')}</span>
                        <span className="text-blue-400">{rate.rate.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
} 