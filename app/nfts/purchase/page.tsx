'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import NFTList from './NFTList'
import { useAuth } from '@/lib/auth'

interface NFT {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url?: string;
    status: string;
}

interface NFTPurchaseRequest {
    user_id: string;
    nft_id: string;
    status: 'pending' | 'approved' | 'rejected';
    payment_method: 'usdt' | 'bank_transfer';  // 許可された支払い方法
    created_at: string;
}

const nftOptions = [
    { 
        id: 'ashigaru', 
        name: '足軽NFT', 
        price: 3000,
        description: '足軽レベルのNFT',
        image: '/images/nfts/ashigaru.jpg',
        level: 'ASHIGARU'
    },
    { 
        id: 'samurai', 
        name: '侍NFT', 
        price: 10000,
        description: '侍レベルのNFT',
        image: '/images/nfts/samurai.jpg',
        level: 'SAMURAI'
    },
    { 
        id: 'daimyo', 
        name: '大名NFT', 
        price: 30000,
        description: '大名レベルのNFT',
        image: '/images/nfts/daimyo.jpg',
        level: 'DAIMYO'
    },
    { 
        id: 'shogun', 
        name: '将軍NFT', 
        price: 100000,
        description: '将軍レベルのNFT',
        image: '/images/nfts/shogun.jpg',
        level: 'SHOGUN'
    }
];

// 必要なNFTを判定する関数
const getRequiredNFTs = (currentLevel: string, targetLevel: string): string[] => {
    const levels = ['NORMAL', 'ASHIGARU', 'SAMURAI', 'DAIMYO', 'SHOGUN'];
    const currentIndex = levels.indexOf(currentLevel.toUpperCase());
    const targetIndex = levels.indexOf(targetLevel);
    
    return levels.slice(currentIndex + 1, targetIndex + 1);
};

export default function NFTPurchasePage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [nfts, setNfts] = useState<NFT[]>([])
    const [selectedNFT, setSelectedNFT] = useState<string>('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [paymentMessage, setPaymentMessage] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<string>('')
    const [showSuccessModal, setShowSuccessModal] = useState(false)

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

            if (session.user.email === 'testadmin@gmail.com') {
                router.push('/admin/dashboard')
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
            console.log('Fetching NFTs...');
            
            const { data, error } = await supabase
                .from('nft_master')
                .select(`
                    id,
                    name,
                    price,
                    daily_rate,
                    image_url,
                    status,
                    is_special
                `)
                .eq('status', 'active')
                .eq('is_special', false)  // 通常NFTのみ
                .order('price', { ascending: true });  // 価格順に並べる

            if (error) throw error;
            console.log('Retrieved NFTs:', data);
            setNfts(data);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            setError('NFTの取得に失敗しました');
        }
    };

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
        e.preventDefault();
        if (!selectedNFT) {
            setError('NFTを選択してください');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('nft_purchase_requests')
                .insert({
                    user_id: user.id,
                    nft_id: selectedNFT,
                    status: 'pending',
                    payment_method: 'usdt'
                });

            if (insertError) throw insertError;

            setShowPaymentModal(true);
        } catch (error: any) {
            console.error('Error submitting purchase:', error);
            setError('購入申請に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>
    if (error) return <div>{error}</div>
    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                onLogout={handleLogout}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">NFT購入</h1>

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
                                        {nft.name} - {nft.price.toLocaleString()} USDT (日利: {(nft.daily_rate * 100).toFixed(2)}%)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedNFT || loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? '処理中...' : '購入する'}
                        </button>
                    </form>

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

                    {showSuccessModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6">
                                <div className="text-white whitespace-pre-wrap">
                                    {message}
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