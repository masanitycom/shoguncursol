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

// NFTの型定義を修正
interface NFT {
    id: string
    user_id: string
    nft: {
        id: string
        name: string
        image_url: string
        price: number
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
            const { data: nfts, error: nftsError } = await supabase
                .from('user_nfts')
                .select(`
                    *,
                    nft:nfts (
                        id,
                        name,
                        price,
                        image_url
                    )
                `)
                .eq('user_id', user.id)

            if (nftsError) throw nftsError
            setUserNFTs(nfts as NFT[] || [])
        } catch (error) {
            console.error('Error:', error)
            setError('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
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
                            <div className="text-white text-2xl font-bold">$0</div>
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

                    {/* 所有NFT一覧 */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-white mb-6">所有NFT一覧</h2>
                        {loading ? (
                            <div className="text-center text-gray-400">読み込み中...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {userNFTs.map((userNft) => (
                                    <div key={userNft.id} className="bg-gray-700 rounded-lg overflow-hidden">
                                        <img
                                            src={`/images/nfts/${userNft.nft.image_url}`}
                                            alt={userNft.nft.name}
                                            className="w-full aspect-square object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="font-bold text-white text-lg mb-2">{userNft.nft.name}</h3>
                                            <p className="text-gray-400">${userNft.nft.price.toLocaleString()}</p>
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