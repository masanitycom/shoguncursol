'use client'

import React, { useEffect, useState } from 'react'
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
import { NFTCard } from '@/components/NFTCard'

// NFTの型定義を修正
interface NFT {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    created_at: string;
}

// NFT購入リクエストの型定義を修正
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_name: string;
    nft_price: number;
    nft_daily_rate: number;
    nft_image_url: string | null;
    user_email: string;
    user_display_name: string | null;
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
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/login');
                    return;
                }

                // 管理者のアクセスを制限
                if (session.user.email === 'testadmin@gmail.com') {
                    router.push('/admin/dashboard');
                    return;
                }

                if (isMounted) {
                    setUser(session.user);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setUserNFTs([]);
                router.push('/login');
            } else if (session?.user) {
                // 管理者のアクセスを制限
                if (session.user.email === 'testadmin@gmail.com') {
                    router.push('/admin/dashboard');
                    return;
                }
                setUser(session.user);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            isMounted = false;
        };
    }, [router]);

    useEffect(() => {
        let isMounted = true;

        const loadNFTData = async () => {
            if (!user?.id) return;

            try {
                console.log('Loading NFT data for user:', user.email);
                const data = await fetchNFTs(user.id);
                
                if (isMounted && data) {
                    console.log('Setting NFT data for user:', user.email, data);
                }
            } catch (error) {
                console.error('Error loading NFT data:', error);
            }
        };

        loadNFTData();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    const initializeDashboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            console.log('Current session user:', session.user);
            setUser(session.user)

            // NFTデータを取得
            const nftData = await fetchNFTs(session.user.id);
            console.log('Initialized NFT data:', nftData);

            // レベル情報の取得
            const levelInfo = await fetchUserLevelInfo(session.user.id);
            if (levelInfo) {
                setLevelInfo(levelInfo);
            }

            // ユーザーデータの取得
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (userError) throw userError;
            setUserData(userData);

        } catch (error) {
            console.error('Error initializing dashboard:', error);
            setError('データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    // 総投資額を計算する関数を修正
    const calculateTotalInvestment = (nfts: NFT[]): number => {
        if (!nfts) return 0;
        return nfts.reduce((total, nft) => {
            if (!nft) return total;
            return total + (nft.price || 0);
        }, 0);
    };

    // レベル判定に必要な情報を取得する関数を修正
    const fetchUserLevelInfo = async (userId: string) => {
        try {
            // 承認済みの購入履歴から投資額を計算
            const { data: purchases, error: purchasesError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    nft_settings!fk_nft_settings (
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')

            if (purchasesError) throw purchasesError

            const personalInvestment = purchases?.reduce((sum, purchase) => {
                return sum + (purchase.nft_settings?.price || 0)
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

    // 日付をJST（日本時間）で表示する関数を追加
    const formatDateToJST = (dateString: string | null): string => {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        // UTCからJSTに変換（+9時間）
        date.setHours(date.getHours() + 9);
        
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Tokyo'
        });
    };

    // 複利を含めた報酬を計算する関数を修正
    const calculateCompoundRewards = (nftRequests: NFTPurchaseRequest[]) => {
        if (!nftRequests || nftRequests.length === 0) return 0;
        
        const today = new Date();
        today.setHours(today.getHours() + 9); // JSTに調整

        const totalRewards = nftRequests.reduce((total, request) => {
            if (!request.nft_price || !request.nft_daily_rate) return total;
            if (!request.approved_at) return total;

            const startDate = new Date(request.approved_at);
            startDate.setHours(startDate.getHours() + 9); // JSTに調整
            
            let currentValue = request.nft_price;
            let currentDate = new Date(startDate);

            console.log('Processing NFT:', {
                name: request.nft_name,
                price: request.nft_price,
                dailyRate: request.nft_daily_rate,
                startDate: startDate.toISOString(),
                today: today.toISOString()
            });

            // 週ごとに計算
            while (currentDate <= today) {
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(endOfWeek.getDate() + 5);

                const weekBusinessDays = calculateBusinessDays(
                    currentDate,
                    endOfWeek > today ? today : endOfWeek
                );

                for (let i = 0; i < weekBusinessDays; i++) {
                    const dailyProfit = currentValue * (request.nft_daily_rate / 100);
                    currentValue += dailyProfit;
                }

                currentDate.setDate(currentDate.getDate() + 7);
            }

            const profit = currentValue - request.nft_price;
            return total + profit;
        }, 0);

        console.log('Total rewards calculated:', totalRewards);
        return totalRewards;
    };

    // NFTデータを取得する部分を修正
    const fetchNFTs = async (userId: string) => {
        try {
            console.log('Fetching NFTs for user:', userId)
            const { data: requests, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    *,
                    nfts:nft_settings (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')  // 承認済みのみを取得
                .order('approved_at', { ascending: false })

            if (error) throw error

            console.log('Purchase requests:', requests)

            // 重複を除去してデータを変換
            const uniqueNFTs = Array.from(new Map(
                requests.map(request => [request.nft_id, request])
            ).values())

            const nftData = uniqueNFTs.map(request => {
                if (!request.nfts) {
                    console.log(`No NFT data found for id: ${request.nft_id}`)
                    return null
                }

                return {
                    id: request.nft_id,
                    name: request.nfts.name,
                    price: parseFloat(request.nfts.price),
                    daily_rate: parseFloat(request.nfts.daily_rate || '1.0'),
                    image_url: request.nfts.image_url,
                    created_at: request.approved_at || request.created_at
                }
            }).filter(Boolean)

            console.log('Processed NFT data:', nftData)

            if (nftData && nftData.length > 0) {
                setUserNFTs(nftData)
                setRequests(requests)
                console.log('NFT data set successfully:', nftData)
            }

            return nftData
        } catch (error: any) {
            console.error('Error fetching NFTs:', error)
            setError('NFTの取得に失敗しました')
            return []
        }
    }

    // ログアウト処理を修正
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setUserNFTs([]);
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
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
            <Header user={user} onLogout={handleLogout} />
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
                                        const fetchedRequests = await fetchNFTs(user.id);
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
                        ) : userNFTs && userNFTs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {userNFTs.map((nft, index) => (
                                    <div key={`${nft.id}-${index}`} className="bg-gray-700 rounded-lg overflow-hidden">
                                        <NFTCard nft={nft} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">NFTを所有していません</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
} 