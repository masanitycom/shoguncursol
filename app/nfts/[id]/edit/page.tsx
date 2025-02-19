'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import type { NFTSettings } from '@/types/nft'
import { useAuth } from '../../../providers/auth'

interface NFTEditPageProps {
    params: {
        id: string
    }
}

export default function NFTEditPage({ params }: NFTEditPageProps) {
    const router = useRouter()
    const { user, loading, handleLogout } = useAuth()
    const [nft, setNft] = useState<NFTSettings | null>(null)
    const [loadingNFT, setLoadingNFT] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchNFT()
    }, [params.id])

    const fetchNFT = async () => {
        try {
            const { data, error } = await supabase
                .from('nft_settings')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error
            setNft(data)
        } catch (error) {
            console.error('Error fetching NFT:', error)
            setError('NFTの取得に失敗しました')
        } finally {
            setLoadingNFT(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nft) return

        try {
            setLoadingNFT(true)
            const { error } = await supabase
                .from('nft_settings')
                .update({
                    name: nft.name,
                    price: nft.price,
                    daily_rate: nft.daily_rate,
                    description: nft.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', params.id)

            if (error) throw error
            router.push('/admin/nfts')
        } catch (error) {
            console.error('Error updating NFT:', error)
            setError('NFTの更新に失敗しました')
        } finally {
            setLoadingNFT(false)
        }
    }

    if (loadingNFT) return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!nft) return <div>NFT not found</div>

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user}
                onLogout={handleLogout}
                profile={{
                    email: user?.email || '',
                    name: undefined
                }}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">NFT編集</h1>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                名前
                            </label>
                            <input
                                type="text"
                                value={nft.name}
                                onChange={(e) => setNft({ ...nft, name: e.target.value })}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                価格 (USDT)
                            </label>
                            <input
                                type="number"
                                value={nft.price}
                                onChange={(e) => setNft({ ...nft, price: Number(e.target.value) })}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                日利率 (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={nft.daily_rate}
                                onChange={(e) => setNft({ ...nft, daily_rate: Number(e.target.value) })}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                説明
                            </label>
                            <textarea
                                value={nft.description || ''}
                                onChange={(e) => setNft({ ...nft, description: e.target.value })}
                                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                キャンセル
                            </button>
                            <button
                                type="submit"
                                disabled={loadingNFT}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                {loadingNFT ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
} 