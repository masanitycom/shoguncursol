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
    UsersIcon,
    UserIcon
} from '@heroicons/react/24/outline'
import DailyRatesDisplay from '@/components/DailyRatesDisplay'
import { LEVELS } from '@/lib/constants/levels'

// NFTの型定義
interface NFT {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    status: string;
    image_url: string;
    description: string;
    created_at: string;
    owner_id: string;
    approved_at: string | null;
}

// NFT購入リクエストの型定義
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    created_at: string;
    approved_at: string | null;
    nft_id: string;
    nfts: NFT;
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userNFTs, setUserNFTs] = useState<NFT[]>([])
    const [requests, setRequests] = useState<NFTPurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [levelInfo, setLevelInfo] = useState<{ maxLine: number; otherLines: number; personalInvestment: number } | null>(null)
    const [userData, setUserData] = useState<any>(null)
    const [nfts, setNfts] = useState<any[]>([])

    useEffect(() => {
        initializeDashboard()
    }, [])

    const initializeDashboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)

            // 承認済みの購入申請を取得
            const { data: purchaseRequests, error: requestsError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    nft_id,
                    approved_at,
                    nft_settings:nft_id (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'approved')

            if (requestsError) throw requestsError
            setNfts(purchaseRequests || [])

            // レベル情報の取得（カラム名を修正）
            const { data: levelData, error: levelError } = await supabase
                .from('user_levels')
                .select(`
                    id,
                    level,
                    max_line,
                    other_lines,
                    personal_investment
                `)
                .eq('id', session.user.id)  // user_idではなくidを使用
                .single()

            if (levelError) {
                console.error('Level data error:', levelError)
                // レベルデータが取得できない場合はデフォルト値を設定
                setLevelInfo({
                    maxLine: 0,
                    otherLines: 0,
                    personalInvestment: 0
                })
            } else {
                setLevelInfo({
                    maxLine: levelData.max_line || 0,
                    otherLines: levelData.other_lines || 0,
                    personalInvestment: levelData.personal_investment || 0
                })
            }

            // ユーザーデータの取得
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (userError) throw userError
            setUserData(userData)

        } catch (error) {
            console.error('Error initializing dashboard:', error)
            setError('データの取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    // 総投資額を計算する関数を追加
    const calculateTotalInvestment = (nfts: NFT[]): number => {
        return nfts.reduce((total, purchase) => {
            // nft_purchase_requestsのデータ構造に合わせて修正
            return total + (purchase.price || 0)
        }, 0)
    }

    // レベル判定に必要な情報を取得する関数を修正
    const fetchUserLevelInfo = async (userId: string) => {
        try {
            // 承認済みの購入履歴から投資額を計算
            const { data: purchases, error: purchasesError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    nfts (
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')

            if (purchasesError) throw purchasesError

            const personalInvestment = purchases?.reduce((sum, purchase) => {
                return sum + (purchase.nfts?.price || 0)
            }, 0) || 0

            // 直紹介の傘下の情報を取得
            const { data: referrals, error: referralError } = await supabase
                .from('user_data')
                .select(`
                    id,
                    investment,
                    referrer
                `)
                .eq('referrer', userId)

            if (referralError) throw referralError

            // 系列ごとの投資額を計算
            const lines = referrals?.map(user => user.investment || 0) || []
            const maxLine = lines.length > 0 ? Math.max(...lines) : 0
            const otherLines = lines.reduce((sum, line) => sum + line, 0) - maxLine

            return {
                maxLine,
                otherLines,
                personalInvestment
            }
        } catch (error) {
            console.error('Error fetching level info:', error)
            return null
        }
    }

    // レベル計算用の関数を修正
    const calculateUserLevel = (personalInvestment: number, maxLine: number, otherLines: number): string => {
        // 個人の投資額が1000ドル未満の場合
        if (personalInvestment < 1000) return '--'

        // 直紹介の傘下の合計が1000ドル以上で足軽レベル
        if (maxLine >= 1000) return '足軽'
        
        return '--'
    }

    // useEffectでレベル情報を取得
    useEffect(() => {
        if (user) {
            fetchUserLevelInfo(user.id).then(info => {
                if (info) setLevelInfo(info)
            })
        }
    }, [user, userNFTs])

    // 営業日数を計算する関数
    const calculateBusinessDays = (startDate: Date, endDate: Date) => {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // 0=日曜, 6=土曜
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    };

    // 複利を含めた報酬を計算する関数
    const calculateCompoundRewards = (nftRequests: NFTPurchaseRequest[]) => {
        console.log('Calculating compound rewards for NFTs:', JSON.stringify(nftRequests, null, 2));
        const today = new Date();
        
        const totalRewards = nftRequests.reduce((total, request) => {
            const nft = request.nfts;
            if (!request.approved_at) {
                console.log(`Skipping NFT ${nft?.name || 'Unknown'}: not approved`);
                return total;
            }
            
            const startDate = new Date(request.approved_at);
            let currentValue = nft.price;
            let currentDate = new Date(startDate);
            let weeklyLog = [];
            
            console.log('Processing NFT:', {
                name: nft.name,
                price: nft.price,
                dailyRate: nft.daily_rate,
                startDate: startDate.toISOString(),
                today: today.toISOString()
            });
            
            // 週ごとに計算
            while (currentDate <= today) {
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(endOfWeek.getDate() + 5); // 金曜日まで
                
                const weekStartValue = currentValue;
                
                // その週の営業日数を計算
                const weekBusinessDays = calculateBusinessDays(
                    currentDate,
                    endOfWeek > today ? today : endOfWeek
                );
                
                // その週の報酬を計算（日利は%で保存）
                for (let i = 0; i < weekBusinessDays; i++) {
                    const dailyProfit = currentValue * nft.daily_rate;
                    currentValue += dailyProfit;
                    console.log(`Day ${i + 1}: ${currentValue.toFixed(2)} (+${dailyProfit.toFixed(2)})`);
                }
                
                weeklyLog.push({
                    weekStart: currentDate.toLocaleDateString(),
                    weekEnd: endOfWeek.toLocaleDateString(),
                    startValue: weekStartValue,
                    endValue: currentValue,
                    businessDays: weekBusinessDays,
                    profit: currentValue - weekStartValue
                });
                
                currentDate.setDate(currentDate.getDate() + 7);
            }
            
            const profit = currentValue - nft.price;
            console.log(`NFT ${nft.name} final calculation:`, {
                initialValue: nft.price,
                finalValue: currentValue,
                profit: profit,
                weeklyBreakdown: weeklyLog
            });
            
            return total + profit;
        }, 0);

        console.log('Total pending rewards:', totalRewards);
        return totalRewards;
    };

    // NFTデータを取得する部分を一箇所に統一
    const fetchNFTs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // まず承認済みの購入申請を取得
            const { data: purchaseRequests, error: requestsError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    nft_id,
                    approved_at,
                    nft_settings:nft_id (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'approved')

            if (requestsError) throw requestsError
            setNfts(purchaseRequests || [])

        } catch (error) {
            console.error('Error fetching NFTs:', error)
        } finally {
            setLoading(false)
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">読み込み中...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white bg-red-600 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">ダッシュボード</h1>

                    {/* 統計カード */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">現在のレベル</div>
                            <div className="space-y-2">
                                <div className="text-white text-2xl font-bold flex items-baseline space-x-2">
                                    <span className="font-japanese">
                                        {loading || !levelInfo ? '--' : calculateUserLevel(
                                            levelInfo.personalInvestment,
                                            levelInfo.maxLine,
                                            levelInfo.otherLines
                                        )}
                                    </span>
                                </div>
                                {!loading && levelInfo && (
                                    <div className="space-y-1">
                                        <div className="text-sm">
                                            <span className="text-gray-400">最大系列：</span>
                                            <span className="text-white">${levelInfo.maxLine.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">他系列：</span>
                                            <span className="text-white">${levelInfo.otherLines.toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">個人投資：</span>
                                            <span className="text-white">${levelInfo.personalInvestment.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">総投資額</div>
                            <div className="text-white text-2xl font-bold">
                                ${loading ? '--' : calculateTotalInvestment(userNFTs).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">保留中の報酬</div>
                            <div className="text-white text-2xl font-bold">
                                {userNFTs.length > 0 ? (
                                    <span onClick={async () => {
                                        const fetchedRequests = await fetchNFTs();
                                        const rewards = calculateCompoundRewards(fetchedRequests || []);
                                        console.log('Calculated rewards:', rewards);
                                    }}>
                                        ${Math.floor(calculateCompoundRewards(requests)).toLocaleString()}
                                    </span>
                                ) : (
                                    '$0'
                                )}
                            </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                        <Link href="/profile"
                            className="group bg-teal-600 p-4 rounded-lg hover:bg-teal-700 transition-colors relative overflow-hidden"
                        >
                            <div className="flex items-start space-x-3">
                                <UserIcon className="w-6 h-6 text-teal-200 flex-shrink-0" />
                                <div>
                                    <h3 className="text-white font-bold mb-2">プロフィール編集</h3>
                                    <p className="text-sm text-teal-100">アカウント情報の確認・編集</p>
                                </div>
                            </div>
                            <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                <UserIcon className="w-24 h-24 text-white" />
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
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {nfts.map((nft) => (
                                    <div key={nft.id} className="bg-gray-700 rounded-lg overflow-hidden">
                                        <div className="w-3/4 mx-auto">
                                            <img
                                                src={nft.nft_settings?.image_url || '/images/nft-placeholder.png'}
                                                alt={nft.nft_settings?.name}
                                                className="w-full aspect-square object-cover rounded-lg shadow-lg"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-white text-lg mb-2">
                                                {nft.nft_settings?.name}
                                            </h3>
                                            <p className="text-gray-300">
                                                価格: ${nft.nft_settings?.price?.toLocaleString()}
                                            </p>
                                            <p className="text-gray-300">
                                                日利: {(nft.nft_settings?.daily_rate || 0) * 100}%
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                購入日: {new Date(nft.approved_at).toLocaleDateString('ja-JP')}
                                            </p>
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