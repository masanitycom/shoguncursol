'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
    const [loading, setLoading] = useState(true)
    const [userNFTs, setUserNFTs] = useState([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const { data: nfts } = await supabase
                .from('nfts')
                .select('*')
            setUserNFTs(nfts || [])
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return null

    return (
        <>
            {!userNFTs.length && (
                <div className="text-gray-400 mb-6">
                    NFTを所有していません
                </div>
            )}

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Link href="/nfts/purchase" 
                    className="bg-emerald-600 p-4 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <h3 className="text-white font-bold mb-2">NFTを購入する</h3>
                    <p className="text-sm text-emerald-100">新しいNFTを購入して収益を増やしましょう</p>
                </Link>
                <Link href="/rewards/airdrop"
                    className="bg-blue-600 p-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <h3 className="text-white font-bold mb-2">エアドロップを受け取る</h3>
                    <p className="text-sm text-blue-100">デイリータスクに回答してエアドロップを受け取りましょう</p>
                </Link>
                <Link href="/rewards/history"
                    className="bg-violet-600 p-4 rounded-lg hover:bg-violet-700 transition-colors"
                >
                    <h3 className="text-white font-bold mb-2">報酬履歴を確認</h3>
                    <p className="text-sm text-violet-100">過去の報酬申請履歴を確認できます</p>
                </Link>
                <Link href="/organization"
                    className="bg-indigo-600 p-4 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <h3 className="text-white font-bold mb-2">組織図を表示</h3>
                    <p className="text-sm text-indigo-100">あなたの紹介ネットワークを確認できます</p>
                </Link>
            </div>

            {/* 所有NFT一覧 */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">所有NFT一覧</h2>
                {userNFTs.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {userNFTs.map((nft: any) => (
                            <div key={nft.id} className="bg-gray-700 rounded-lg overflow-hidden">
                                <img
                                    src={`/images/nfts/${nft.image_url}`}
                                    alt={nft.name}
                                    className="w-full aspect-square object-cover"
                                />
                                <div className="p-3">
                                    <h3 className="font-bold text-white text-sm mb-1">{nft.name}</h3>
                                    <p className="text-sm text-gray-400">${nft.price.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
} 