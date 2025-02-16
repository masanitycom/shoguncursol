'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import { NFTOperation, RewardStatus } from '@/types/RewardTypes'
import { NFTCard } from './components/NFTCard'
import { calculateNFTOperationStatus } from '@/utils/nftOperations'

export default function DashboardPage() {
    const { user, handleLogout } = useAuth()
    const [nftOperations, setNftOperations] = useState<NFTOperation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNFTOperations = async () => {
            try {
                // NFTの運用データを取得
                const { data: nfts, error } = await supabase
                    .from('user_nfts')
                    .select(`
                        id,
                        nft_settings (
                            name,
                            price,
                            daily_rate
                        ),
                        purchase_date,
                        status
                    `)
                    .eq('user_id', user?.id)
                    .order('purchase_date', { ascending: false })

                if (error) throw error

                // 各NFTの運用状況を計算して更新
                const operations: NFTOperation[] = nfts.map(nft => ({
                    id: nft.id,
                    name: nft.nft_settings.name,
                    nftId: nft.id,
                    userId: user?.id || '',
                    purchaseDate: new Date(nft.purchase_date),
                    purchaseAmount: nft.nft_settings.price,
                    dailyRate: nft.nft_settings.daily_rate,
                    ...calculateNFTOperationStatus(
                        new Date(nft.purchase_date),
                        nft.nft_settings.daily_rate
                    )
                }))

                setNftOperations(operations)
            } catch (error) {
                console.error('NFT operations fetch error:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchNFTOperations()
        }
    }, [user])

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-white mb-6">保有NFT</h2>
                
                {loading ? (
                    <div className="text-center text-gray-400">読み込み中...</div>
                ) : nftOperations.length === 0 ? (
                    <div className="text-center text-gray-400">
                        NFTがありません
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nftOperations.map(operation => (
                            <NFTCard
                                key={operation.id}
                                nft={operation}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
} 