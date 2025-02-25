'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

interface NFT {
    id: string
    name: string
    price: number
    daily_rate: number
    is_special: boolean
}

// 日利データの型を修正
interface DailyRateData {
    date: string
    rates: { [key: string]: number | null } // NFT ID をキーとした実際の日利
}

interface BulkSettings {
    nftId: string | null
    date: string | null
    rate: number
}

export default function DailyRatesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [nfts, setNfts] = useState<NFT[]>([])
    const [selectedWeek, setSelectedWeek] = useState<string>(getMonday(new Date()))
    const [dailyRates, setDailyRates] = useState<DailyRateData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [bulkSettings, setBulkSettings] = useState<BulkSettings>({
        nftId: null,
        date: null,
        rate: 0
    })
    const [notification, setNotification] = useState<{
        type: 'success' | 'error',
        message: string
    } | null>(null)
    const [inputValues, setInputValues] = useState<{ [key: string]: string | undefined }>({})

    // 週の開始日（月曜日）を取得
    function getMonday(date: Date): string {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 日曜日の場合は前の週の月曜日
        d.setDate(diff)
        return d.toISOString().split('T')[0]
    }

    // 週の日付配列を生成（月曜から金曜）
    function getWeekDates(startDate: string): string[] {
        const dates: string[] = []
        const start = new Date(startDate)
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(start)
            date.setDate(start.getDate() + i)
            dates.push(date.toISOString().split('T')[0])
        }
        
        return dates
    }

    // 前の週へ
    const handlePrevWeek = () => {
        const date = new Date(selectedWeek)
        date.setDate(date.getDate() - 7)
        setSelectedWeek(getMonday(date))
    }

    // 次の週へ
    const handleNextWeek = () => {
        const date = new Date(selectedWeek)
        date.setDate(date.getDate() + 7)
        setSelectedWeek(getMonday(date))
    }

    // 今週へ
    const handleCurrentWeek = () => {
        setSelectedWeek(getMonday(new Date()))
    }

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                    window.location.replace('/admin/login')
                    return
                }
                
                setUser(session.user)
            } catch (error) {
                console.error('Auth check error:', error)
                window.location.replace('/admin/login')
            }
        }

        checkAuth()
    }, [])

    useEffect(() => {
        fetchNFTs()
    }, [])

    useEffect(() => {
        if (selectedWeek && nfts.length > 0) {
            initializeWeeklyRates();
        }
    }, [selectedWeek, nfts])

    const fetchNFTs = async () => {
        try {
            const { data, error } = await supabase
                .from('nft_master')
                .select('*')
                .eq('status', 'active')
                .order('price')

            if (error) throw error
            setNfts(data || [])
        } catch (error: any) {
            console.error('Error fetching NFTs:', error)
            setError(error.message)
        }
    }

    const initializeWeeklyRates = async () => {
        try {
            const weekDates = getWeekDates(selectedWeek);
            
            // 既存のデータを取得
            const { data: existingRates, error } = await supabase
                .from('daily_rates')
                .select('*')
                .gte('date', weekDates[0])
                .lte('date', weekDates[4]);

            if (error) throw error;

            // 初期値を設定
            const initialRates: DailyRateData[] = weekDates.map(date => ({
                date,
                rates: Object.fromEntries(nfts.map(nft => {
                    // 既存のデータがあれば、その値を使用
                    const existingRate = existingRates?.find(
                        rate => rate.date === date && rate.nft_id === nft.id
                    );
                    return [nft.id, existingRate ? existingRate.rate : null];
                }))
            }));

            setDailyRates(initialRates);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing rates:', error);
            setError('日利の初期化に失敗しました');
            setLoading(false);
        }
    };

    const handleRateChange = (date: string, nftId: string, value: number | null) => {
        const newRates = dailyRates.map(day => {
            if (day.date === date) {
                return {
                    ...day,
                    rates: {
                        ...day.rates,
                        [nftId]: value
                    }
                }
            }
            return day
        })
        setDailyRates(newRates)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setNotification(null)

        try {
            // 既存のレートを削除
            const startDate = new Date(selectedWeek)
            const endDate = new Date(startDate)
            endDate.setDate(startDate.getDate() + 4)

            console.log('Deleting rates for:', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });

            const { error: deleteError } = await supabase
                .from('daily_rates')
                .delete()
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])

            if (deleteError) throw deleteError

            // 新しいレートを登録
            const newRates = dailyRates.flatMap(day => 
                Object.entries(day.rates)
                    .filter(([_, rate]) => rate !== null && rate > 0)
                    .map(([nftId, rate]) => ({
                        date: day.date,
                        nft_id: nftId,
                        rate: rate,
                        created_at: new Date().toISOString()
                    }))
            )

            console.log('Saving new rates:', newRates);

            if (newRates.length === 0) {
                console.log('No rates to save');
                setNotification({
                    type: 'success',
                    message: '設定をクリアしました'
                })
                setLoading(false)
                return
            }

            const { error: insertError } = await supabase
                .from('daily_rates')
                .insert(newRates)

            if (insertError) throw insertError

            console.log('Rates saved successfully');

            // 保存確認のためのクエリ
            const { data: savedRates, error: checkError } = await supabase
                .from('daily_rates')
                .select('*')
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])

            console.log('Saved rates:', savedRates);

            if (checkError) {
                console.error('Error checking saved rates:', checkError);
            }

            setNotification({
                type: 'success',
                message: '日利を設定しました'
            })

            await initializeWeeklyRates()

        } catch (error: any) {
            console.error('Error saving daily rates:', error)
            setError(error.message)
            setNotification({
                type: 'error',
                message: 'エラーが発生しました: ' + error.message
            })
        } finally {
            setLoading(false)
        }
    }

    // 一括設定を適用
    const handleBulkApply = () => {
        const newRates = [...dailyRates]
        
        // 日付が選択されている場合
        if (bulkSettings.date) {
            const dayRate = newRates.find(day => day.date === bulkSettings.date)
            if (dayRate) {
                // NFTが選択されている場合は特定のNFTのみ
                if (bulkSettings.nftId) {
                    const nft = nfts.find(n => n.id === bulkSettings.nftId)
                    if (nft && bulkSettings.rate <= nft.daily_rate * 100) {
                        dayRate.rates[bulkSettings.nftId] = bulkSettings.rate / 100
                    }
                }
                // NFTが選択されていない場合は全NFT
                else {
                    nfts.forEach(nft => {
                        if (bulkSettings.rate <= nft.daily_rate * 100) {
                            dayRate.rates[nft.id] = bulkSettings.rate / 100
                        }
                    })
                }
            }
        }
        // 日付が選択されていない場合は全日付
        else {
            newRates.forEach(dayRate => {
                // NFTが選択されている場合は特定のNFTのみ
                if (bulkSettings.nftId) {
                    const nft = nfts.find(n => n.id === bulkSettings.nftId)
                    if (nft && bulkSettings.rate <= nft.daily_rate * 100) {
                        dayRate.rates[bulkSettings.nftId] = bulkSettings.rate / 100
                    }
                }
                // NFTが選択されていない場合は全NFT
                else {
                    nfts.forEach(nft => {
                        if (bulkSettings.rate <= nft.daily_rate * 100) {
                            dayRate.rates[nft.id] = bulkSettings.rate / 100
                        }
                    })
                }
            })
        }

        setDailyRates(newRates)
    }

    // ログアウト処理
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            // リダイレクトはhandleAuthStateChangeで処理されるため、ここでは何もしない
        } catch (error) {
            console.error('Logout error:', error)
            window.location.replace('/admin/login')
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
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white mb-8">日利設定</h3>

                        <div className="mb-6 flex items-center space-x-4">
                            <button
                                onClick={handlePrevWeek}
                                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                前週
                            </button>
                            
                            <button
                                onClick={handleCurrentWeek}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                            >
                                今週
                            </button>
                            
                            <button
                                onClick={handleNextWeek}
                                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                次週
                            </button>

                            <span className="text-white">
                                {new Date(selectedWeek).toLocaleDateString('ja-JP')} の週
                            </span>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="px-6 py-3 text-left text-white">NFT</th>
                                        <th className="px-6 py-3 text-left text-white">種別</th>
                                        <th className="px-6 py-3 text-left text-white">価格</th>
                                        <th className="px-6 py-3 text-left text-white">上限</th>
                                        {dailyRates.map(day => (
                                            <th key={day.date} className="px-6 py-3 text-left text-white">
                                                {new Date(day.date).toLocaleDateString('ja-JP')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {nfts.map((nft) => (
                                        <tr key={nft.id} className="hover:bg-gray-750">
                                            <td className="px-6 py-4 text-white">
                                                {nft.name}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {nft.is_special ? '特例' : '通常'}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                ${nft.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {(nft.daily_rate * 100).toFixed(2)}%
                                            </td>
                                            {dailyRates.map(day => (
                                                <td key={day.date} className="px-6 py-4">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="text"
                                                            value={
                                                                inputValues[`${day.date}-${nft.id}`] !== undefined
                                                                    ? inputValues[`${day.date}-${nft.id}`]
                                                                    : day.rates[nft.id] === null 
                                                                        ? '' 
                                                                        : ((day.rates[nft.id] || 0) * 100).toFixed(3)
                                                            }
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setInputValues({
                                                                    ...inputValues,
                                                                    [`${day.date}-${nft.id}`]: value
                                                                });

                                                                if (value === '') {
                                                                    handleRateChange(day.date, nft.id, null);
                                                                    return;
                                                                }

                                                                const numValue = parseFloat(value);
                                                                if (!isNaN(numValue) && numValue <= nft.daily_rate * 100) {
                                                                    handleRateChange(day.date, nft.id, numValue / 100);
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const value = e.target.value;
                                                                
                                                                setInputValues({
                                                                    ...inputValues,
                                                                    [`${day.date}-${nft.id}`]: undefined
                                                                });

                                                                if (value === '') {
                                                                    handleRateChange(day.date, nft.id, null);
                                                                    return;
                                                                }

                                                                const numValue = parseFloat(value);
                                                                if (!isNaN(numValue) && numValue <= nft.daily_rate * 100) {
                                                                    handleRateChange(day.date, nft.id, numValue / 100);
                                                                }
                                                            }}
                                                            className="w-24 bg-gray-700 text-white px-3 py-2 rounded text-right pr-8"
                                                            placeholder="0.000"
                                                        />
                                                        <span className="absolute right-3 text-gray-400">%</span>
                                                        <button
                                                            onClick={() => {
                                                                handleRateChange(
                                                                    day.date,
                                                                    nft.id,
                                                                    nft.daily_rate
                                                                );
                                                            }}
                                                            className="ml-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded"
                                                            title="最大値に設定"
                                                        >
                                                            Max
                                                        </button>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '保存中...' : '保存する'}
                            </button>
                        </div>

                        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
                            <h4 className="text-white text-lg mb-4">一括設定</h4>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-gray-300 mb-2">NFT</label>
                                    <select
                                        value={bulkSettings.nftId || ''}
                                        onChange={(e) => setBulkSettings({
                                            ...bulkSettings,
                                            nftId: e.target.value || null
                                        })}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                    >
                                        <option value="">全て</option>
                                        {nfts.map(nft => (
                                            <option key={nft.id} value={nft.id}>
                                                {nft.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">日付</label>
                                    <select
                                        value={bulkSettings.date || ''}
                                        onChange={(e) => setBulkSettings({
                                            ...bulkSettings,
                                            date: e.target.value || null
                                        })}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                    >
                                        <option value="">全て</option>
                                        {dailyRates.map(day => (
                                            <option key={day.date} value={day.date}>
                                                {new Date(day.date).toLocaleDateString('ja-JP')}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-300 mb-2">日利 (%)</label>
                                    <input
                                        type="text"
                                        value={bulkSettings.rate}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const numValue = parseFloat(value);
                                            if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
                                                setBulkSettings({
                                                    ...bulkSettings,
                                                    rate: numValue || 0
                                                });
                                            }
                                        }}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        placeholder="0.000"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={handleBulkApply}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        一括設定
                                    </button>
                                </div>
                            </div>
                        </div>

                        {notification && (
                            <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
                                notification.type === 'success' 
                                    ? 'bg-green-500' 
                                    : 'bg-red-500'
                            }`}>
                                <p className="text-white">{notification.message}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
} 