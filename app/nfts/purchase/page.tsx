'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

interface NFT {
    id: string
    name: string
    nft_type: string
    status: 'active' | 'inactive'
    price: number
    image_url?: string
    description?: string
}

export default function NFTPurchasePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [nfts, setNfts] = useState<NFT[]>([])
    const [selectedNFT, setSelectedNFT] = useState<string>('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paymentMessage, setPaymentMessage] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer')

    useEffect(() => {
        checkAuth()
        fetchPaymentMessage()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
            await fetchNFTs()
        } catch (error) {
            console.error('Error checking auth:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchNFTs = async () => {
        try {
            const { data: nfts, error } = await supabase
                .from('nfts')
                .select('*')
                .eq('status', 'active')
                .order('price', { ascending: true })

            if (error) throw error
            console.log('Fetched NFTs:', nfts)  // デバッグ用

            // 型を明示的に指定して変換
            const typedNfts: NFT[] = nfts?.map(nft => ({
                id: nft.id,
                name: nft.name,
                nft_type: nft.nft_type,
                status: nft.status,
                price: nft.price,
                image_url: nft.image_url,
                description: nft.description
            })) || []

            setNfts(typedNfts)
        } catch (error: any) {
            console.error('Error fetching NFTs:', error)
            setError('NFTの取得に失敗しました')
        }
    }

    const fetchPaymentMessage = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'payment_message')
                .single()

            if (error) throw error
            if (data) {
                setPaymentMessage(data.value)
            }
        } catch (error: any) {
            console.error('Error fetching payment message:', error)
            setError('支払い情報の取得に失敗しました')
        }
    }

    const handlePurchase = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedNFT) {
            setError('NFTを選択してください')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { error: insertError } = await supabase
                .from('nft_purchase_requests')
                .insert({
                    user_id: user.id,
                    nft_id: selectedNFT,
                    payment_method: paymentMethod,
                    status: 'pending'
                })

            if (insertError) {
                console.error('Insert error:', insertError)
                throw new Error('購入申請の登録に失敗しました')
            }

            setShowPaymentModal(true)
        } catch (error: any) {
            console.error('Error submitting purchase:', error)
            setError('購入申請に失敗しました。もう一度お試しください。')
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">NFT購入</h1>

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePurchase} className="bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="mb-6">
                            <label className="block text-white mb-2">NFTを選択</label>
                            <select
                                value={selectedNFT}
                                onChange={(e) => setSelectedNFT(e.target.value)}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                            >
                                <option value="">選択してください</option>
                                {nfts.map((nft) => (
                                    <option key={nft.id} value={nft.id}>
                                        {nft.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                        >
                            購入する
                        </button>
                    </form>

                    {/* 支払い情報モーダル */}
                    {showPaymentModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                                <div className="text-white whitespace-pre-wrap">
                                    {paymentMessage}
                                </div>
                                <div className="flex justify-end mt-6">
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                                    >
                                        確認
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
} 