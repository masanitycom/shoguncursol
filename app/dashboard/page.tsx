'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { 
    ShoppingCartIcon, 
    GiftIcon, 
    ClockIcon, 
    UsersIcon 
} from '@heroicons/react/24/outline'
import DailyRatesDisplay from '@/components/DailyRatesDisplay'

// NFTの型定義を更新
interface NFT {
    id: string
    user_id: string
    purchase_date: string
    nft: {
        id: string
        name: string
        image_url: string
        price: number
        description?: string
        status: 'active' | 'inactive'
        daily_rate: number
    }
    created_at: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userNFTs, setUserNFTs] = useState<NFT[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
        } catch (error) {
            console.error('Error checking auth:', error)
            setError('認証エラーが発生しました')
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        if (!user) return

        try {
            // NFTデータの取得
            const { data: nfts, error: nftsError } = await supabase
                .from('user_nfts')
                .select(`
                    id,
                    user_id,
                    purchase_date,
                    nft:nft_id (
                        id,
                        name,
                        price,
                        image_url,
                        description,
                        daily_rate,
                        status
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active')

            if (nftsError) throw nftsError

            // NFT画像のURLを取得
            const nftsWithImageUrls = nfts?.map(nft => ({
                ...nft,
                nft: {
                    ...nft.nft,
                    image_url: nft.nft.image_url || null
                }
            })) || []

            setUserNFTs(nftsWithImageUrls as NFT[])
        } catch (error) {
            console.error('Error:', error)
            setError('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    // 総投資額を計算する関数を追加
    const calculateTotalInvestment = (nfts: NFT[]): number => {
        return nfts.reduce((total, userNft) => total + userNft.nft.price, 0)
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">ダッシュボード</h1>

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/50 border-l-4 border-red-500 text-red-200 rounded">
                            {error}
                        </div>
                    )}

                    {!userNFTs.length && (
                        <div className="text-gray-400 mb-6">
                            NFTを所有していません
                        </div>
                    )}

                    {/* 統計カード */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">総投資額</div>
                            <div className="text-white text-2xl font-bold">
                                ${loading ? '...' : calculateTotalInvestment(userNFTs).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">保留中の報酬</div>
                            <div className="text-white text-2xl font-bold">$0</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">紹介者数</div>
                            <div className="text-white text-2xl font-bold">0人</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">最終報酬日</div>
                            <div className="text-white text-2xl font-bold">-</div>
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Link href="/nfts/purchase" 
                            className="group bg-emerald-600 p-4 rounded-lg hover:bg-emerald-700 transition-colors relative overflow-hidden"
                        >
                            <div className="flex items-start space-x-3">
                                <ShoppingCartIcon className="w-6 h-6 text-emerald-200 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-2">NFTを購入する</h3>
                                    <p className="text-sm text-emerald-100">新しいNFTを購入して収益を増やしましょう</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                <ShoppingCartIcon className="w-24 h-24 text-white" />
                            </div>
                        </Link>
                        <Link href="/rewards/airdrop"
                            className="group bg-blue-600 p-4 rounded-lg hover:bg-blue-700 transition-colors relative overflow-hidden"
                        >
                            <div className="flex items-start space-x-3">
                                <GiftIcon className="w-6 h-6 text-blue-200 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-2">エアドロップを受け取る</h3>
                                    <p className="text-sm text-blue-100">デイリータスクに回答してエアドロップを受け取りましょう</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                <GiftIcon className="w-24 h-24 text-white" />
                            </div>
                        </Link>
                        <Link href="/rewards/history"
                            className="group bg-violet-600 p-4 rounded-lg hover:bg-violet-700 transition-colors relative overflow-hidden"
                        >
                            <div className="flex items-start space-x-3">
                                <ClockIcon className="w-6 h-6 text-violet-200 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-2">報酬履歴を確認</h3>
                                    <p className="text-sm text-violet-100">過去の報酬申請履歴を確認できます</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                <ClockIcon className="w-24 h-24 text-white" />
                            </div>
                        </Link>
                        <Link href="/organization"
                            className="group bg-indigo-600 p-4 rounded-lg hover:bg-indigo-700 transition-colors relative overflow-hidden"
                        >
                            <div className="flex items-start space-x-3">
                                <UsersIcon className="w-6 h-6 text-indigo-200 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-2">組織図を表示</h3>
                                    <p className="text-sm text-indigo-100">あなたの紹介ネットワークを確認できます</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                <UsersIcon className="w-24 h-24 text-white" />
                            </div>
                        </Link>
                    </div>

                    {/* 日利表示を追加 */}
                    <DailyRatesDisplay />

                    {/* 所有NFT一覧 */}
                    <div className="bg-gray-800 rounded-lg p-6 mt-8">
                        <h2 className="text-xl font-bold text-white mb-6">所有NFT一覧</h2>
                        {loading ? (
                            <div className="text-center text-gray-400">読み込み中...</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {userNFTs.map((userNft) => (
                                    <div key={userNft.id} 
                                        className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-all duration-200 transform hover:-translate-y-1"
                                    >
                                        <div className="aspect-square relative w-full">
                                            {userNft.nft.image_url ? (
                                                <img
                                                    src={userNft.nft.image_url}
                                                    alt={userNft.nft.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                    <span className="text-gray-400">No image</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                Active
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-bold text-white text-sm mb-1">{userNft.nft.name}</h3>
                                            <div className="space-y-1 text-sm">
                                                <p className="text-emerald-400">${userNft.nft.price.toLocaleString()}</p>
                                                <p className="text-blue-400">
                                                    日利上限: {userNft.nft.daily_rate.toFixed(2)}%
                                                </p>
                                                <p className="text-gray-400">
                                                    購入日: {new Date(userNft.purchase_date).toLocaleDateString('ja-JP')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
} 