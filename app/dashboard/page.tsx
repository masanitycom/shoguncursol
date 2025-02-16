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
import { calculateNFTStatus, calculateProfitDisplayDate } from '@/lib/services/nft-status-calculator'
import { calculateUserLevel } from '@/app/lib/utils/calculateUserLevel'
import type { 
    LevelStats, 
    UserLevelParams, 
    UserProfile,  // この型を使用
    LevelInfo 
} from '@/app/types/user'
import { NFTSettings as ImportedNFTSettings } from '@/app/types/nft'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { calculateWeeklyProfit } from '@/lib/services/profit-calculator'

const DEFAULT_NFT_IMAGE = 'https://placehold.co/400x300/1f2937/ffffff?text=NFT'; // プレースホルダー画像を使用

// ローカルの型定義を削除し、インポートした型を使用
type NFTSettings = ImportedNFTSettings;

// 2. NFT購入リクエストの型
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_settings: NFTSettings;
}

// 3. 表示用のNFT型
interface NFT {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string | null;
    purchase_date: string;
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

// NFTSettingsの型を修正
interface NFTSettingsData {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string | null;
}

// NFTQueryResultの型を修正
interface NFTQueryResult {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_settings: NFTSettingsData;
}

interface NFTMaster {
    id: string
    name: string
    price: number
    daily_rate: number
    image_url: string | null
    description: string | null
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

// levelInfoのstate型を修正
interface CustomUser extends SupabaseUser {
    // 追加のプロパティがあれば定義
}

// 投資額情報の型を定義
interface InvestmentInfo {
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
}

interface HTMLImageElementWithSrc extends HTMLImageElement {
    src: string;
}

interface WeeklyProfit {
    totalProfit: number;
    startDate: Date;
    endDate: Date;
    dailyProfits: {
        date: Date;
        rate: number;
        profit: number;
    }[];
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<CustomUser | null>(null)
    const [userNFTs, setUserNFTs] = useState<NFT[]>([])
    const [requests, setRequests] = useState<NFTPurchaseRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null)
    const [userData, setUserData] = useState<UserProfile | null>(null)
    const [nfts, setNfts] = useState<ProcessedNFT[]>([])
    const [referralCount, setReferralCount] = useState(0)
    const [currentLevel, setCurrentLevel] = useState<string>('')
    const [investmentInfo, setInvestmentInfo] = useState({
        investment_amount: 0,
        max_line_investment: 0,
        other_lines_investment: 0
    });
    const [weeklyProfits, setWeeklyProfits] = useState<WeeklyProfit[]>([]);

    const fetchNFTs = useCallback(async (userId: string) => {
        try {
            if (!userId) throw new Error('ユーザーIDが無効です');

            const { data, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    user_id,
                    nft_id,
                    status,
                    created_at,
                    approved_at,
                    nft_settings!inner (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url,
                        description
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return { nfts: [], requests: [] };

            // 型アサーションを使用
            const typedData = data as unknown as NFTQueryResult[];

            // NFTデータの整形
            const processedNFTs = typedData.map(item => ({
                id: item.id,
                name: item.nft_settings.name || 'Unknown NFT',
                price: Number(item.nft_settings.price) || 0,
                daily_rate: Number(item.nft_settings.daily_rate) || 0,
                image_url: item.nft_settings.image_url || DEFAULT_NFT_IMAGE,
                description: item.nft_settings.description || null,
                purchase_date: item.approved_at || item.created_at
            }));

            const processedRequests = typedData.map(item => ({
                id: item.id,
                user_id: item.user_id,  // user.id ではなく user_id を直接使用
                nft_id: item.nft_id,
                status: item.status,
                created_at: item.created_at,
                approved_at: item.approved_at,
                nft_settings: item.nft_settings
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
        if (user?.id) {
            fetchNFTs(user.id);
        }
    }, [user?.id, fetchNFTs]);

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
                    setUser(session.user as CustomUser);
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
                setUser(session.user as CustomUser);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            isMounted = false;
        };
    }, [router]);

    // fetchUserProfile関数の戻り値の型を修正
    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    user_id,
                    name,
                    name_kana,
                    email,
                    wallet_address,
                    wallet_type,
                    investment_amount,
                    total_team_investment,
                    max_line_investment,
                    other_lines_investment,
                    active,
                    created_at,
                    updated_at
                `)
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error('Profile fetch error:', error);
                return null;
            }

            return profile || {
                id: userId,
                user_id: userId,
                name: '',
                name_kana: '',
                email: '',
                wallet_address: null,
                wallet_type: null,
                investment_amount: 0,
                total_team_investment: 0,
                max_line_investment: 0,
                other_lines_investment: 0,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const initializeDashboard = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            if (!userId) {
                router.push('/login');
                return;
            }

            setUser(session.user as CustomUser);

            // プロファイル情報を取得
            const profile = await fetchUserProfile(userId);
            if (profile) {
                setUserData(profile);
                setInvestmentInfo({
                    investment_amount: Number(profile.investment_amount) || 0,
                    max_line_investment: Number(profile.max_line_investment) || 0,
                    other_lines_investment: Number(profile.other_lines_investment) || 0
                });

                // レベル情報を設定
                setLevelInfo({
                    max_line_investment: Number(profile.max_line_investment) || 0,
                    other_lines_investment: Number(profile.other_lines_investment) || 0,
                    investment_amount: Number(profile.investment_amount) || 0
                });
            }

            // NFTデータを取得
            await fetchNFTs(userId);

            // 紹介者数を取得
            const { data: referrals } = await supabase
                .from('users')
                .select('id')
                .eq('referrer_id', userId);

            if (Array.isArray(referrals)) {
                setReferralCount(referrals.length);
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

    // fetchUserLevelInfo関数を修正
    const fetchUserLevelInfo = async (userId: string): Promise<LevelInfo | null> => {
        try {
            // まず承認済みの購入リクエストを取得
            const { data: requests, error: requestError } = await supabase
                .from('nft_purchase_requests')
                .select('nft_id')
                .eq('user_id', userId)
                .eq('status', 'approved')

            if (requestError) throw requestError

            if (!requests || requests.length === 0) {
                return {
                    max_line_investment: 0,
                    other_lines_investment: 0,
                    investment_amount: 0
                }
            }

            // プロファイル情報を取得
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    investment_amount,
                    max_line_investment,
                    other_lines_investment
                `)
                .eq('user_id', userId)
                .single();

            if (profileError) throw profileError;

            return {
                max_line_investment: Number(profile.max_line_investment) || 0,
                other_lines_investment: Number(profile.other_lines_investment) || 0,
                investment_amount: Number(profile.investment_amount) || 0
            };

        } catch (error) {
            console.error('Error fetching level info:', error)
            return {
                max_line_investment: 0,
                other_lines_investment: 0,
                investment_amount: 0
            }
        }
    }

    // レベル情報の更新処理
    useEffect(() => {
        let isMounted = true;

        const loadLevelInfo = async () => {
            if (!user) return;
            
            try {
                const info = await fetchUserLevelInfo(user.id);
                if (isMounted && info) {
                    setLevelInfo(info);
                    // レベル計算のロジックを追加
                    const levelStats = calculateUserLevel({
                        personalInvestment: info.investment_amount,
                        maxLine: info.max_line_investment,
                        otherLines: info.other_lines_investment
                    });
                    // calculateUserLevel は直接レベル文字列を返すので、そのまま使用
                    setCurrentLevel(levelStats);
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
        date.setHours(date.getHours() + 9);
        
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
        });
    };

    // 複利を含めた報酬を計算する関数を修正
    const calculateCompoundRewards = (nftRequests: NFTPurchaseRequest[]): number => {
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
            if (!user?.id) return;

            try {
                // プロファイル情報を取得
                const profile = await fetchUserProfile(user.id);
                if (profile) {
                    setUserData(profile);
                    setInvestmentInfo({
                        investment_amount: Number(profile.investment_amount) || 0,
                        max_line_investment: Number(profile.max_line_investment) || 0,
                        other_lines_investment: Number(profile.other_lines_investment) || 0
                    });

                    // レベル情報を設定
                    setLevelInfo({
                        max_line_investment: Number(profile.max_line_investment) || 0,
                        other_lines_investment: Number(profile.other_lines_investment) || 0,
                        investment_amount: Number(profile.investment_amount) || 0
                    });
                }

                // NFTデータを取得
                await fetchNFTs(user.id);
            } catch (error) {
                console.error('Error initializing data:', error);
            }
        };

        initializeData();
    }, [user?.id]);

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

    const renderNFTList = () => {
        if (loading) {
            return (
                <div className="text-center text-gray-400">読み込み中...</div>
            );
        }

        if (!userNFTs || userNFTs.length === 0) {
            return (
                <div className="text-center text-gray-400">NFTを所有していません</div>
            );
        }

        return (
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {userNFTs.map((nft) => (
                    <div key={nft.id} className="bg-gray-800 rounded-lg overflow-hidden w-40">
                        <div className="w-40 h-40">
                            <img
                                src={nft.image_url || DEFAULT_NFT_IMAGE}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const img = e.currentTarget as unknown as HTMLImageElementWithSrc;
                                    img.src = DEFAULT_NFT_IMAGE;
                                }}
                            />
                        </div>
                        <div className="p-2">
                            <h3 className="text-xs font-semibold text-white mb-1">{nft.name}</h3>
                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="text-gray-400">価格</p>
                                    <p className="text-white font-medium">{nft.price.toLocaleString()} USDT</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">日利</p>
                                    <p className="text-green-400 font-medium">{(nft.daily_rate * 100).toFixed(2)}%</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                購入日: {formatDateToJST(nft.purchase_date)}
                            </div>
                        </div>
                        <div className="px-2 pb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${calculateNFTStatus(new Date(nft.purchase_date)).status === '待機中' ? 'bg-yellow-100 text-yellow-800' : 
                                  calculateNFTStatus(new Date(nft.purchase_date)).status === '運用中' ? 'bg-green-100 text-green-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {calculateNFTStatus(new Date(nft.purchase_date)).status}
                            </span>
                            <p className="mt-1 text-sm text-gray-300">
                                {calculateNFTStatus(new Date(nft.purchase_date)).message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // checkAuth関数を削除し、initializeDashboard関数を使用するように修正
    useEffect(() => {
        initializeDashboard();
    }, []);

    // fetchUserNFTs関数を修正
    const fetchUserNFTs = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('No session found');
                return;
            }

            console.log('Fetching NFTs for user:', session.user.id);

            const { data: nftData, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    user_id,
                    nft_id,
                    status,
                    created_at,
                    approved_at,
                    nft_settings:nft_settings_id (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url,
                        description
                    )
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'approved');

            if (error) throw error;

            if (nftData && nftData.length > 0) {
                // 型安全な方法でデータを処理
                const processedNFTs: NFT[] = nftData.map((item: any) => {
                    const nftSettings = item.nft_settings as NFTSettingsData;
                    return {
                        id: item.id,
                        name: nftSettings.name,
                        price: Number(nftSettings.price),
                        daily_rate: Number(nftSettings.daily_rate),
                        image_url: nftSettings.image_url || DEFAULT_NFT_IMAGE,
                        description: nftSettings.description || `日利上限: ${nftSettings.daily_rate}%`,
                        purchase_date: item.approved_at || item.created_at
                    };
                });

                console.log('Processed NFTs:', processedNFTs);
                setUserNFTs(processedNFTs);
            } else {
                console.log('No NFTs found');
                setUserNFTs([]);
            }
        } catch (error) {
            console.error('Error fetching NFTs:', error);
            setError('NFTデータの取得に失敗しました');
        }
    };

    useEffect(() => {
        const fetchProfits = async () => {
            if (!userNFTs) return;

            const profits = await Promise.all(
                userNFTs.map(async nft => {
                    const operationStartDate = calculateNFTStatus(
                        new Date(nft.purchase_date)
                    ).startDate;

                    if (!operationStartDate) return null;

                    // 報酬表示日が今日かどうかチェック
                    const displayDate = calculateProfitDisplayDate(operationStartDate);
                    const today = new Date();
                    
                    if (
                        displayDate.getDate() === today.getDate() &&
                        displayDate.getMonth() === today.getMonth() &&
                        displayDate.getFullYear() === today.getFullYear()
                    ) {
                        return await calculateWeeklyProfit(
                            nft.id,
                            nft.price,
                            operationStartDate
                        );
                    }
                    return null;
                })
            );

            setWeeklyProfits(profits.filter(Boolean) as WeeklyProfit[]);
        };

        fetchProfits();
    }, [userNFTs]);

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
                                        {loading ? '--' : currentLevel}
                                    </span>
                                </div>
                                {!loading && levelInfo && (
                                    <div className="space-y-1">
                                        <div className="text-sm">
                                            <span className="text-gray-400">最大系列：</span>
                                            <span className="text-white">
                                                ${(levelInfo?.max_line_investment || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">他系列：</span>
                                            <span className="text-white">
                                                ${(levelInfo?.other_lines_investment || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-400">個人投資：</span>
                                            <span className="text-white">
                                                ${(levelInfo?.investment_amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">総投資額</div>
                            <div className="text-white text-2xl font-bold">
                                ${investmentInfo.investment_amount.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">保留中の報酬</div>
                            <div className="text-white text-2xl font-bold">
                                ${calculateCompoundRewards(requests).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">紹介者数</div>
                            <div className="text-white text-2xl font-bold">{referralCount}人</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">最終報酬日</div>
                            <div className="text-white text-2xl font-bold">-</div>
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* NFT購入 */}
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

                        {/* エアドロップ */}
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

                        {/* 報酬履歴 */}
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

                        {/* 組織図 */}
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

                        {/* プロフィール */}
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

                    {/* NFT一覧 */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4">保有NFT</h3>
                        {renderNFTList()}
                    </div>
                </div>
            </main>
        </div>
    );
}