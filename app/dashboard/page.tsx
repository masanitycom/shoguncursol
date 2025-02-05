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
import { calculateNFTStatus } from '@/lib/services/nft-status-calculator'

// 1. まず、基本となる型を定義
interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
}

// 2. NFT購入リクエストの型
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_settings: NFTSettings;  // 単一のオブジェクトとして定義
}

// 3. 表示用のNFT型
interface NFT {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    created_at: string;
    nft_settings?: {  // nft_masterをnft_settingsに変更
        name: string
        price: number
        daily_rate: number
        image_url: string | null
    }
}

// データベースから取得する生のデータの型を修正
interface RawNFTData {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nfts: NFTSettings[];  // 配列として定義
}

// 処理後のNFTデータの型
interface ProcessedNFT {
    id: string;
    name: string;
    price: number;
    dailyRate: number;
    imageUrl: string | null;
    purchaseDate: string;
    status: string;
    approvedAt: string | null;
}

// Supabaseのクエリ結果の型を定義
interface NFTQueryResult {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_settings: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    };
}

interface NFTMaster {
    id: string
    name: string
    price: number
    daily_rate: number
    image_url: string | null
}

interface UserNFT {
    nft_id: string
    nfts: NFTMaster  // 正しい型を参照
}

// 型定義を修正
interface NFTPurchaseRequestWithNFT {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft: NFTMaster;  // nft_masterテーブルからのデータ
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('認証が必要です');

            const { data, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    user_id,
                    nft_id,
                    status,
                    created_at,
                    approved_at,
                    nft_settings:nft_id (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return { nfts: [], requests: [] };

            // 型アサーションを使用して正しい型を指定
            const typedData = data as unknown as NFTQueryResult[];

            // NFTデータの整形
            const processedNFTs = typedData.map(item => ({
                id: item.id,
                name: item.nft_settings?.name || 'Unknown NFT',
                price: item.nft_settings?.price || 0,
                daily_rate: item.nft_settings?.daily_rate || 0,
                image_url: item.nft_settings?.image_url || '/images/default-nft.png',
                created_at: item.created_at
            }));

            // NFTPurchaseRequest型に変換
            const processedRequests = typedData.map(item => ({
                id: item.id,
                user_id: item.user_id,
                nft_id: item.nft_id,
                status: item.status,
                created_at: item.created_at,
                approved_at: item.approved_at,
                nft_settings: {  // nftsではなくnft_settingsとして定義
                    id: item.nft_settings.id,
                    name: item.nft_settings.name,
                    price: item.nft_settings.price,
                    daily_rate: item.nft_settings.daily_rate,
                    image_url: item.nft_settings.image_url
                }
            }));

            setUserNFTs(processedNFTs);
            setRequests(processedRequests);

            return { nfts: processedNFTs, requests: processedRequests };
        } catch (error) {
            console.error('Error in fetchNFTs:', error);
            setError('NFTの取得に失敗しました');
            return { nfts: [], requests: [] };
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadNFTData = async () => {
            if (!user?.id) {
                console.log('No user ID available');
                return;
            }

            try {
                const { data: nftData, error } = await supabase
                    .from('nft_purchase_requests')
                    .select(`
                        id,
                        user_id,
                        nft_id,
                        status,
                        created_at,
                        approved_at,
                        nfts:nft_settings (
                            id,
                            name,
                            price,
                            daily_rate,
                            image_url
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'approved');

                if (error) throw error;

                if (isMounted && nftData) {
                    // NFTデータの整形
                    const processedNFTs: NFT[] = nftData.map((item: any) => ({
                        id: item.nft_id,
                        name: item.nfts[0]?.name || 'Unknown NFT',
                        price: Number(item.nfts[0]?.price) || 0,
                        daily_rate: Number(item.nfts[0]?.daily_rate) || 0,
                        image_url: item.nfts[0]?.image_url || '/images/default-nft.png',
                        created_at: item.approved_at || item.created_at,
                        description: `日利上限: ${item.nfts[0]?.daily_rate || 0}%`
                    }));

                    // リクエストデータの整形
                    const processedRequests: NFTPurchaseRequest[] = nftData.map((item: any) => ({
                        id: item.id,
                        user_id: item.user_id,
                        nft_id: item.nft_id,
                        status: item.status,
                        created_at: item.created_at,
                        approved_at: item.approved_at,
                        nft_settings: {  // nftsではなくnft_settingsとして定義
                            id: item.nfts[0]?.id,
                            name: item.nfts[0]?.name || 'Unknown NFT',
                            price: Number(item.nfts[0]?.price) || 0,
                            daily_rate: Number(item.nfts[0]?.daily_rate) || 0,
                            image_url: item.nfts[0]?.image_url || '/images/default-nft.png'
                        }
                    }));

                    setUserNFTs(processedNFTs);
                    setRequests(processedRequests);  // 型付けされたデータを使用
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

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    display_name,
                    email,
                    created_at,
                    updated_at
                `)
                .eq('id', userId)
                .single();

            if (error) throw error;
            return profile;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const initializeDashboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            console.log('Current session user:', session.user);
            setUser(session.user);

            // プロファイル情報を取得
            const profile = await fetchUserProfile(session.user.id);
            if (profile) {
                setUserData(profile);
            }

            // NFTデータを取得
            const { nfts, requests } = await fetchNFTs(session.user.id);
            console.log('Initialized NFT data:', nfts);

            // レベル情報の取得
            const levelInfo = await fetchUserLevelInfo(session.user.id);
            if (levelInfo) {
                setLevelInfo(levelInfo);
            }

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
            const level = LEVELS.find(l => personalInvestment >= l.requirements.nftAmount) || LEVELS[0]
            
            return {
                maxLine: level.requirements.maxLine,
                otherLines: level.requirements.otherLines,
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
            // nftsプロパティから価格と日利を取得
            const price = Number(request.nft_settings.price);
            const dailyRate = Number(request.nft_settings.daily_rate);

            if (!price || !dailyRate || !request.approved_at) return total;

            const startDate = new Date(request.approved_at);
            startDate.setHours(startDate.getHours() + 9); // JSTに調整
            
            let currentValue = price;
            let currentDate = new Date(startDate);

            console.log('Processing NFT:', {
                name: request.nft_settings.name,
                price: price,
                dailyRate: dailyRate,
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
                    const dailyProfit = currentValue * (dailyRate / 100);
                    currentValue += dailyProfit;
                }

                currentDate.setDate(currentDate.getDate() + 7);
            }

            const profit = currentValue - price;
            return total + profit;
        }, 0);

        console.log('Total rewards calculated:', totalRewards);
        return totalRewards;
    };

    // 初期化時にデータを取得
    useEffect(() => {
        const initializeData = async () => {
            if (!user?.id) {
                console.log('No user ID available');
                return;
            }

            try {
                console.log('Initializing data for user:', user.id);
                const { nfts, requests } = await fetchNFTs(user.id);
                console.log('Initialized NFTs:', nfts);
            } catch (error) {
                console.error('Error initializing data:', error);
                setError('データの初期化に失敗しました');
            }
        };

        initializeData();
    }, [user?.id, fetchNFTs]);

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
            <Header 
                user={user} 
                profile={userData}  // プロファイル情報を追加
                onLogout={handleLogout} 
            />
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
                                        const { requests: fetchedRequests } = await fetchNFTs(user.id);
                                        const rewards = calculateCompoundRewards(fetchedRequests);
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

                    {/* 所有NFT一覧 */}
                    <div className="bg-gray-800 rounded-lg p-6 mt-8">
                        <h2 className="text-xl font-bold text-white mb-6">所有NFT一覧</h2>
                        {loading ? (
                            <div className="text-center text-gray-400">読み込み中...</div>
                        ) : userNFTs && userNFTs.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {userNFTs.map((nft, index) => {
                                    const statusInfo = calculateNFTStatus(new Date(nft.created_at))
                                    
                                    return (
                                        <div key={`${nft.id}-${index}`} className="bg-gray-700 rounded-lg overflow-hidden">
                                            <NFTCard 
                                                nft={{
                                                    ...nft,
                                                    created_at: formatDateToJST(nft.created_at)
                                                }} 
                                            />
                                            <div className="mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${statusInfo.status === '待機中' ? 'bg-yellow-100 text-yellow-800' : 
                                                      statusInfo.status === '運用中' ? 'bg-green-100 text-green-800' : 
                                                      'bg-red-100 text-red-800'}`}>
                                                    {statusInfo.status}
                                                </span>
                                                <p className="mt-1 text-sm text-gray-300">
                                                    {statusInfo.message}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
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