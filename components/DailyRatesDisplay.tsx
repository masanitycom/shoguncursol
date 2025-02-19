'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DailyRate } from '@/types/nft'

interface DailyRatesDisplayProps {
    nftTypeId: number;
    weekId: string;
}

export default function DailyRatesDisplay({ nftTypeId, weekId }: DailyRatesDisplayProps) {
    const [loading, setLoading] = useState(true)
    const [rates, setRates] = useState<DailyRate[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDailyRates = async () => {
            try {
                setLoading(true)
                const { data, error } = await supabase
                    .from('daily_rates')
                    .select('*')
                    .eq('nft_type_id', nftTypeId)
                    .eq('week_id', weekId)
                    .order('date', { ascending: true })

                if (error) throw error

                const rates = data.map(rate => ({
                    id: rate.id,
                    nftTypeId: rate.nft_type_id,
                    date: new Date(rate.date),
                    rate: rate.rate,
                    weekId: rate.week_id
                }))

                setRates(rates)
                setLoading(false)
            } catch (error) {
                console.error('Error fetching daily rates:', error)
                setError('日次レートの取得に失敗しました')
                setLoading(false)
            }
        }

        fetchDailyRates()
    }, [nftTypeId, weekId])

    if (loading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">日次レート</h3>
            <div className="grid grid-cols-7 gap-2">
                {rates.map(rate => (
                    <div key={rate.id} className="p-2 bg-gray-800 rounded">
                        <div className="text-sm text-gray-400">
                            {rate.date.toLocaleDateString('ja-JP')}
                        </div>
                        <div className="font-semibold">
                            {rate.rate.toFixed(2)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 