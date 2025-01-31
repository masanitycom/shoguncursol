'use client'

import { useEffect, useState } from 'react'

interface NFTRate {
    rate: number
    nft_master: {
        id: string
        name: string
        price: number
        daily_rate: number
        image_url: string
    }
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
            const response = await fetch('/api/daily-rates')
            const data = await response.json()

            if (data.error) throw new Error(data.error)
            setRates(data.rates || [])
        } catch (error: any) {
            console.error('Error fetching daily rates:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-gray-400">読み込み中...</div>
    if (error) return <div className="text-red-500">{error}</div>
    if (!rates.length) return <div className="text-gray-400">NFTを所持していません</div>

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">日利レート</h2>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rates.map((item) => (
                        <div key={item.nft_master.id} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <img
                                    src={item.nft_master.image_url}
                                    alt={item.nft_master.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div>
                                    <h4 className="text-white font-medium">{item.nft_master.name}</h4>
                                    <p className="text-gray-400">
                                        上限: {(item.nft_master.daily_rate * 100).toFixed(2)}%
                                    </p>
                                    <p className="text-blue-400 text-lg">
                                        本日: {(item.rate * 100).toFixed(3)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
} 