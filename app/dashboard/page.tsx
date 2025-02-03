'use client'

import React, { useEffect, useState, useCallback } from 'react'
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
    description: string;
    created_at: string;
}

// NFT購入リクエストの型定義を修正
interface NFTPurchaseRequest {
    request_id: string;
    user_id: string;
    nft_id: string;
    status: string;
    approved_at: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string;
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

    const fetchNFTs = useCallback(async (userId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                console.error('No active session')
                throw new Error('認証が必要です')
            }

            const currentUserId = session.user.id
            console.log('Session details:', {
                currentUserId,
                providedUserId: userId,
                email: session.user.email
            })

            if (currentUserId !== userId) {
                console.error('User ID mismatch:', { currentUserId, providedUserId: userId })
                throw new Error('無効なユーザーIDです')
            }

            const { data: nftData, error } = await supabase
                .rpc('get_user_nfts', { 
                    user_id_param: currentUserId
                })

            if (error) {
                console.error('Error fetching NFT data:', error)
                throw error
            }

            console.log('Raw NFT data (detailed):', JSON.stringify(nftData, null, 2))

            if (!nftData || nftData.length === 0) {
                console.log('No NFTs found')
                return []
            }

            const processedNFTs = nftData.map(item => ({
                id: item.nft_id,
                name: item.name,
                price: parseFloat(item.price),
                daily_rate: parseFloat(item.daily_rate || '1.0'),
                image_url: item.image_url || '/images/default-nft.png',
                description: item.description,
                created_at: item.approved_at
            }))

            if (processedNFTs.length > 0) {
                setUserNFTs(processedNFTs)
                setRequests(nftData)
            }

            return processedNFTs
        } catch (error: any) {
            console.error('Error in fetchNFTs:', error)
            setError('NFTの取得に失敗しました')
            return []
        }
    }, [])

    useEffect(() => {
        let isMounted = true;

        const loadNFTData = async () => {
            if (!user?.id) {
                console.log('No user ID available');
                return;
            }

            try {
                console.log('Loading NFT data for user:', user.email);
                const { data: nftData, error } = await supabase
                    .rpc('get_user_nfts', { 
                        user_id_param: user.id
                    });

                if (error) throw error;

                if (isMounted && nftData) {
                    const processedNFTs = nftData.map(item => ({
                        id: item.nft_id,
                        name: item.name,
                        price: parseFloat(item.price),
                        daily_rate: parseFloat(item.daily_rate || '1.0'),
                        image_url: item.image_url || '/images/default-nft.png',
                        description: item.description,
                        created_at: item.approved_at
                    }));

                    setUserNFTs(processedNFTs);
                    setRequests(nftData);
                    console.log('NFT data loaded:', processedNFTs.length, 'items');
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
            // まず承認済みの購入リクエストを取得
            const { data: requests, error: requestError } = await supabase
                .from('nft_purchase_requests')
                .select('nft_id')
                .eq('user_id', userId)
                .eq('status', 'approved')

            if (requestError) throw requestError

            if (!requests || requests.length === 0) {
                return { maxLine: 0, otherLines: 0, personalInvestment: 0 }
            }

            // NFT情報を取得
            const nftIds = requests.map(req => req.nft_id)
            const { data: nftSettings, error: nftError } = await supabase
                .from('nft_settings')
                .select('price')
                .in('id', nftIds)

            if (nftError) throw nftError

            // 投資額を計算
            const personalInvestment = nftSettings.reduce((sum, nft) => 
                sum + parseFloat(nft.price), 0)

            // レベル情報を計算
            const level = LEVELS.find(l => personalInvestment >= l.required) || LEVELS[0]
            
            return {
                maxLine: level.maxLine,
                otherLines: level.otherLines,
                personalInvestment
            }
        } catch (error) {
            console.error('Error fetching level info:', error)
            return { maxLine: 0, otherLines: 0, personalInvestment: 0 }
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
        let isMounted = true;

        const loadLevelInfo = async () => {
            if (!user) return;
            
            try {
                const info = await fetchUserLevelInfo(user.id);
                if (isMounted && info) {
                    setLevelInfo(info);
                }
            } catch (error) {
                console.error('Error loading level info:', error);
            }
        };

        loadLevelInfo();

        return () => {
            isMounted = false;
        };
    }, [user]);

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
            if (!request.price || !request.daily_rate) return total;
            if (!request.approved_at) return total;

            const startDate = new Date(request.approved_at);
            startDate.setHours(startDate.getHours() + 9); // JSTに調整
            
            let currentValue = request.price;
            let currentDate = new Date(startDate);

            console.log('Processing NFT:', {
                name: request.name,
                price: request.price,
                dailyRate: request.daily_rate,
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
                    const dailyProfit = currentValue * (request.daily_rate / 100);
                    currentValue += dailyProfit;
                }

                currentDate.setDate(currentDate.getDate() + 7);
            }

            const profit = currentValue - request.price;
            return total + profit;
        }, 0);

        console.log('Total rewards calculated:', totalRewards);
        return totalRewards;
    };

    // 初期化時にデータを取得
    useEffect(() => {
        const initializeData = async () => {
            if (!user?.id) {
                console.log('No user ID available')
                return
            }

            try {
                console.log('Initializing data for user:', user.id)
                await fetchNFTs(user.id)
            } catch (error) {
                console.error('Error initializing data:', error)
            }
        }

        initializeData()
    }, [user?.id])

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
                                        {loading ? '--' : calculateUserLevel(
                                            levelInfo?.personalInvestment || 0,
                                            levelInfo?.maxLine || 0,
                                            levelInfo?.otherLines || 0
                                        )}
                                    </span>
                                </div>
                                {!loading && levelInfo && (
                                    <div className="space-y-1">
                                        <div className="text-sm">
                                            <span className="text-gray-400">最大系列：</span>
                                            <span className="text-white">
                                                ${(levelInfo.maxLine || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">他系列：</span>
                                            <span className="text-white">
                                                ${(levelInfo.otherLines || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">個人投資：</span>
                                            <span className="text-white">
                                                ${(levelInfo.personalInvestment || 0).toLocaleString()}
                                            </span>
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
                                        <NFTCard 
                                            nft={{
                                                ...nft,
                                                created_at: formatDateToJST(nft.created_at)
                                            }} 
                                        />
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