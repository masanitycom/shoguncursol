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
    UserIcon,
    ArrowUpCircleIcon,
    CurrencyYenIcon
} from '@heroicons/react/24/outline'
import DailyRatesDisplay from '@/components/DailyRatesDisplay'
import { LEVELS } from '@/lib/constants/levels'
import { NFTCard } from '@/components/NFTCard'
import { calculateNFTStatus } from '@/lib/utils/nft-status-calculator';
import { calculateUserLevel } from '@/lib/utils/calculate-user-level';
import type { 
    LevelStats, 
    UserLevelParams, 
    UserProfile,  // この型を使用
    LevelInfo 
} from '@/app/types/user'
import { NFTSettings as ImportedNFTSettings } from '@/app/types/nft'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { calculateWeeklyProfit, calculateProfitDisplayDate } from '@/lib/services/profit-calculator'
import { WeeklyProfit, DailyProfit, isWeeklyProfit } from '@/types/dailyProfit';
import { calculateUserStats } from '@/lib/utils/userLevel';
import { LEVEL_NAMES_JP, getLevelLabel } from '@/lib/levelUtils';
import { buildOrganizationTree } from '@/lib/organization';  // 新規追加
import { fetchUserNFTs } from '@/lib/services/nft';
import { useAuth } from '@/lib/auth'
import { fetchPendingRewards } from '@/lib/services/reward'
import { PendingRewards } from '@/types/reward'
import { formatPrice } from '@/lib/utils'
import { WeeklyProfit as ImportedWeeklyProfit } from '@/types/dailyProfit';

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
    nft_settings: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string;
        description?: string;
    };
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

// 型定義
interface DashboardData {
    currentLevel: string;
    maxLineInvestment: number;
    otherLinesInvestment: number;
    personalInvestment: number;
    nft_purchase_requests: NFTPurchaseRequest[];
    profile: UserProfile;  // any型を具体的な型に変更
    nfts: NFTWithReward[];   // any[]型を具体的な型に変更
    investmentInfo: InvestmentInfo;  // any型を具体的な型に変更
}

// レベルの日本語表示とスタイルを定義
const LEVEL_LABELS: { [key: string]: { name: string; color: string } } = {
    '0': { name: '--', color: 'text-gray-400' },
    '1': { name: '足軽', color: 'text-blue-400' },
    '2': { name: '武将', color: 'text-purple-400' },
    '3': { name: '大名', color: 'text-yellow-400' },
    '4': { name: '将軍', color: 'text-red-400' },
};

// InvestmentSummaryコンポーネントを修正
const InvestmentSummary = ({ info, level }: { info: InvestmentInfo, level: string }) => {
    // LEVEL_REQUIREMENTSから直接レベル情報を取得
    const levelInfo = LEVEL_REQUIREMENTS[level] || LEVEL_REQUIREMENTS['NONE'];
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg h-full flex flex-col">
            <div className="mb-6">
                <h3 className="text-gray-400 text-sm mb-3 text-center">現在のレベル</h3>
                <div className="bg-gray-900 rounded-lg p-4 text-center border border-gray-700">
                    <div className={`inline-flex items-center justify-center ${levelInfo.color}`}>
                        <span className="text-3xl font-bold">{levelInfo.name}</span>
                    </div>
                    {/* 次のレベルまでの条件表示 */}
                </div>
            </div>
            {/* 投資情報 */}
            <div className="space-y-4 flex-grow">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">最大系列</p>
                        <p className="text-white text-lg font-medium">
                            ${info.max_line_investment.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">他系列</p>
                        <p className="text-white text-lg font-medium">
                            ${info.other_lines_investment.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">個人投資</p>
                        <p className="text-white text-lg font-medium">
                            ${info.investment_amount.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// レベル要件の型定義
interface LevelRequirement {
    name: string;
    color: string;
    conditions: {
        investment: number;
        maxLine: number;
        otherLines: number;
    };
    profitShare: number;
}

// レベル判定の条件を修正
const LEVEL_REQUIREMENTS: { [key: string]: LevelRequirement } = {
    'SHOGUN': {
        name: '将軍',
        color: 'text-red-400',
        conditions: {
            investment: 1000,
            maxLine: 600000,
            otherLines: 500000
        },
        profitShare: 2
    },
    'DAIMYO': {
        name: '大名',
        color: 'text-yellow-400',
        conditions: {
            investment: 1000,
            maxLine: 300000,
            otherLines: 150000
        },
        profitShare: 3
    },
    'TAIRO': {
        name: '大老',
        color: 'text-purple-400',
        conditions: {
            investment: 1000,
            maxLine: 100000,
            otherLines: 50000
        },
        profitShare: 4
    },
    'ROJU': {
        name: '老中',
        color: 'text-blue-400',
        conditions: {
            investment: 1000,
            maxLine: 50000,
            otherLines: 25000
        },
        profitShare: 5
    },
    'BUGYO': {
        name: '奉行',
        color: 'text-green-400',
        conditions: {
            investment: 1000,
            maxLine: 10000,
            otherLines: 5000
        },
        profitShare: 6
    },
    'DAIKANN': {
        name: '代官',
        color: 'text-indigo-400',
        conditions: {
            investment: 1000,
            maxLine: 5000,
            otherLines: 2500
        },
        profitShare: 10
    },
    'BUSHO': {
        name: '武将',
        color: 'text-pink-400',
        conditions: {
            investment: 1000,
            maxLine: 3000,
            otherLines: 1500
        },
        profitShare: 25
    },
    'ASHIGARU': {
        name: '足軽',
        color: 'text-gray-400',
        conditions: {
            investment: 1000,
            maxLine: 1000,
            otherLines: 0
        },
        profitShare: 45
    },
    'NONE': {
        name: '--',
        color: 'text-gray-300',
        conditions: {
            investment: 0,
            maxLine: 0,
            otherLines: 0
        },
        profitShare: 0
    }
};

// レベル計算ロジックを修正
const calculateLevel = (data: {
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
}): string => {
    console.log('Level calculation:', data);

    // NFT要件チェック
    if (data.investment_amount < 1000) return 'NONE';

    // 武将以上の判定
    if (data.max_line_investment >= 3000 && data.other_lines_investment >= 1500) {
        if (data.max_line_investment >= 600000 && data.other_lines_investment >= 500000) return 'SHOGUN';
        if (data.max_line_investment >= 300000 && data.other_lines_investment >= 150000) return 'DAIMYO';
        if (data.max_line_investment >= 100000 && data.other_lines_investment >= 50000) return 'TAIRO';
        if (data.max_line_investment >= 50000 && data.other_lines_investment >= 25000) return 'ROJU';
        if (data.max_line_investment >= 10000 && data.other_lines_investment >= 5000) return 'BUGYO';
        if (data.max_line_investment >= 5000 && data.other_lines_investment >= 2500) return 'DAIKAN';
        return 'BUSHO';
    }

    // 足軽の判定（最大系列3000未満でも足軽になれる）
    if (data.max_line_investment >= 1000) {
        console.log('Qualified for ASHIGARU level');
        return 'ASHIGARU';
    }

    return 'NONE';
};

// NFTWithRewardの型を統一
interface NFTWithReward {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    purchase_date: string;
    reward_claimed: boolean;
    image_url: string;
    description: string;
    status: string;
    approved_at: string | null;
    lastWeekReward: number;
}

export default function DashboardPage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [userNFTs, setUserNFTs] = useState<NFTWithReward[]>([])
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
    const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [pendingRewards, setPendingRewards] = useState<PendingRewards>({
        daily: 0,
        conquest: 0,
        total: 0
    })

    const fetchNFTs = async () => {
        try {
            if (!user?.id) return;
            const nfts = await fetchUserNFTs(user.id);
            setUserNFTs(nfts as NFTWithReward[]);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
        }
    };

    useEffect(() => {
        const loadOrganizationData = async () => {
            if (!user?.id) return;
            
            try {
                const { data: authUser } = await supabase.auth.getUser();
                if (!authUser?.user?.email) return;

                // まずemailでプロファイルを検索
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', authUser.user.email)
                    .maybeSingle();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    return;
                }

                if (!profile) {
                    // プロファイルが存在しない場合は新規作成
                    const displayId = `USER${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                    
                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                            id: user.id,
                            email: authUser.user.email,
                            display_id: displayId,
                            name: authUser.user.email?.split('@')[0] || 'Unknown',
                            investment_amount: 0,
                            max_line_investment: 0,
                            other_lines_investment: 0,
                            active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Error creating profile:', createError);
                        return;
                    }

                    // 投資データを設定
                    const investmentData = {
                        investment_amount: newProfile.investment_amount || 0,
                        max_line_investment: newProfile.max_line_investment || 0,
                        other_lines_investment: newProfile.other_lines_investment || 0
                    };

                    setInvestmentInfo(investmentData);
                    setCurrentLevel(calculateLevel(investmentData));
                    return;
                }

                // 既存のプロファイルの場合
                const investmentData = {
                    investment_amount: profile.investment_amount || 0,
                    max_line_investment: profile.max_line_investment || 0,
                    other_lines_investment: profile.other_lines_investment || 0
                };

                setInvestmentInfo(investmentData);
                setCurrentLevel(calculateLevel(investmentData));

            } catch (error) {
                console.error('Error loading organization data:', error);
            }
        };

        // ユーザーIDが変更されたときのみ実行
        if (user?.id) {
            loadOrganizationData();
        }
    }, [user?.id]); // 依存配列を最小限に

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
                setUserNFTs([]);
                router.push('/login');
            } else if (session?.user) {
                // 管理者のアクセスを制限
                if (session.user.email === 'testadmin@gmail.com') {
                    router.push('/admin/dashboard');
                    return;
                }
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
            isMounted = false;
        };
    }, [router]);

    // プロファイル取得のクエリを修正
    const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.id) return null;

            // まずemailで検索
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', authUser.user.email)
                .maybeSingle();

            if (existingProfile) {
                // 既存のプロファイルが見つかった場合、idを更新
                const { data: updatedProfile, error: updateError } = await supabase
                    .from('profiles')
                    .update({ id: userId })
                    .eq('email', authUser.user.email)
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating profile:', updateError);
                    return existingProfile;  // 更新に失敗した場合は既存のプロファイルを返す
                }

                return updatedProfile;
            }

            // プロファイルが存在しない場合は新規作成
            const displayId = `USER${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: authUser.user.email,
                    display_id: displayId,
                    name: authUser.user.email?.split('@')[0] || 'Unknown',
                    investment_amount: 0,
                    max_line_investment: 0,
                    other_lines_investment: 0,
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return null;
            }

            return newProfile;

        } catch (error) {
            console.error('Error in fetchUserProfile:', error);
            return null;
        }
    };

    // NFTデータを変換する関数を追加
    const convertNFTData = (nftData: any[]): NFT[] => {
        return (nftData || []).map(nft => {
            console.log('Converting NFT:', nft); // デバッグ用
            return {
                id: nft.id,
                name: nft.nft_settings?.name || 'Unknown NFT',
                price: Number(nft.nft_settings?.price) || 0,
                daily_rate: Number(nft.nft_settings?.daily_rate) || 0,
                image_url: nft.nft_settings?.image_url || DEFAULT_NFT_IMAGE,
                description: nft.nft_settings?.description || '',
                purchase_date: nft.approved_at || nft.created_at
            };
        });
    };

    // NFTデータの処理関数を修正
    const processNFTData = (nftData: any[]): NFTWithReward[] => {
        return nftData.map(nft => ({
            id: nft.id,
            name: nft.nft_settings.name,
            price: Number(nft.nft_settings.price),
            daily_rate: Number(nft.nft_settings.daily_rate),
            purchase_date: nft.approved_at || nft.created_at,
            reward_claimed: false,
            image_url: nft.nft_settings.image_url || '/images/nft3000.png',
            description: nft.nft_settings.description || '',
            status: nft.status,
            approved_at: nft.approved_at,
            lastWeekReward: 0
        }));
    };

    // 型エラーを修正するためのユーティリティ関数
    const setNFTsWithTypeCheck = (nfts: NFTWithReward[]) => {
        setUserNFTs(nfts as any); // 一時的な型キャストを使用
    };

    // ダッシュボードデータ取得の修正
    const fetchDashboardData = async (userId: string) => {
        try {
            setLoading(true);

            const profile = await fetchUserProfile(userId);
            if (!profile) {
                setError('プロファイルの取得に失敗しました');
                return null;
            }

            const { data: nftData, error: nftError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    user_id,
                    nft_id,
                    status,
                    created_at,
                    approved_at,
                    nft_settings (
                        id,
                        name,
                        price,
                        daily_rate,
                        image_url,
                        description
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved');

            if (nftError) {
                console.error('Error fetching NFT data:', nftError);
                return {
                    profile,
                    nfts: [],
                    investmentData: {
                        investment_amount: profile.investment_amount || 0,
                        max_line_investment: profile.max_line_investment || 0,
                        other_lines_investment: profile.other_lines_investment || 0
                    }
                };
            }

            return {
                profile,
                nfts: processNFTData(nftData || []),
                investmentData: {
                    investment_amount: profile.investment_amount || 0,
                    max_line_investment: profile.max_line_investment || 0,
                    other_lines_investment: profile.other_lines_investment || 0
                }
            };

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('データの取得に失敗しました');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // useEffectを単一の関数に統合
    useEffect(() => {
        const initializeDashboard = async () => {
            if (!user?.id) return;

            const data = await fetchDashboardData(user.id);
            if (!data) return;

            setUserNFTs(data.nfts);
            setInvestmentInfo(data.investmentData);
            setCurrentLevel(calculateLevel(data.investmentData));
        };

        if (user?.id) {
            initializeDashboard();
        }
    }, [user?.id]); // 依存配列を最小限に

    // 総投資額を計算する関数を修正
    const calculateTotalInvestment = (nfts: NFT[]): number => {
        if (!nfts) return 0;
        return nfts.reduce((total, nft) => {
            if (!nft) return total;
            return total + (nft.price || 0);
        }, 0);
    };

    // fetchUserLevelInfo関数を修正
    const fetchUserLevelInfo = async (userId: string) => {
        try {
            // プロフィール情報を取得
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                return null;
            }

            // ダッシュボードデータを取得
            const { data: dashboardData } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    nft_settings (
                        price
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved');

            // 投資額を計算
            const totalInvestment = (dashboardData || []).reduce((sum, item) => 
                sum + (Number(item.nft_settings?.price) || 0), 0);

            // レベル情報を返す
            return {
                investment_amount: totalInvestment,
                max_line_investment: 4000, // 仮の値
                other_lines_investment: 3000 // 仮の値
            };

        } catch (error) {
            console.error('Error fetching level info:', error);
            return null;
        }
    };

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
        try {
            if (!dateString) return '日付未設定';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '日付不正';

            return new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Tokyo'
            }).format(date);
        } catch (error) {
            console.error('Date formatting error:', error);
            return '日付エラー';
        }
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
                }

                // NFTデータを取得
                const nfts = await fetchUserNFTs(user.id);
                console.log('Setting NFTs:', nfts);
                setUserNFTs(nfts as NFTWithReward[]);

                // 紹介者数を取得
                const count = await fetchReferralCount(user.id);
                setReferralCount(count);

            } catch (error) {
                console.error('Error initializing data:', error);
            }
        };

        initializeData();
    }, [user?.id]);

    // NFTカードの表示部分を修正（待機期間の追加）
    const renderNFTList = () => {
        if (!userNFTs || userNFTs.length === 0) {
            return <div className="text-center text-gray-400">NFTを所有していません</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userNFTs.map((nft) => (
                    <NFTCard 
                        key={nft.id} 
                        nft={nft}  // NFTCardに渡すデータ構造を確認
                    />
                ))}
            </div>
        );
    };

    const fetchProfits = async (userId: string) => {
        if (!userId) return;
        
        try {
            const { data, error } = await supabase
                .from('daily_profits')
                .select('*')
                .eq('user_id', userId)  // user_profile_idをuser_idに変更
                .order('date', { ascending: false });

            if (error) throw error;
            
            setDailyProfits(data || []);
        } catch (error) {
            console.error('Error fetching profits:', error);
            setError('利益データの取得に失敗しました');
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchProfits(user.id);
        }
    }, [user]);

    // useEffectの修正
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push('/login');
                    return;
                }

                // プロフィールIDを取得
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', session.user.email)
                    .single();

                // 既存のfetchDashboardDataを使用
                const data = profile?.id ? await fetchDashboardData(profile.id) : null;
                if (data) {
                    setDashboardData({
                        currentLevel: calculateUserLevel({
                            personalInvestment: data.investmentData.investment_amount,
                            maxLine: data.investmentData.max_line_investment,
                            otherLines: data.investmentData.other_lines_investment
                        }),
                        maxLineInvestment: data.investmentData.max_line_investment,
                        otherLinesInvestment: data.investmentData.other_lines_investment,
                        personalInvestment: data.investmentData.investment_amount,
                        nft_purchase_requests: [],  // 必要に応じて設定
                        profile: data.profile,
                        nfts: data.nfts,
                        investmentInfo: data.investmentData
                    });
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        };

        loadDashboardData();
    }, []);

    // 次のレベルを計算する関数
    const getNextLevel = (currentLevel: string): string | null => {
        const levels = ['ASHIGARU', 'BUSHO', 'DAIKANN', 'BUGYO', 'ROJU', 'TAIRO', 'DAIMYO', 'SHOGUN'];
        const currentIndex = levels.indexOf(currentLevel);
        
        if (currentIndex === -1 || currentIndex === levels.length - 1) return null;
        return levels[currentIndex + 1];
    };

    // 次のレベルまでの条件を計算する関数
    const calculateNextLevelRequirements = (currentLevel: string, investmentInfo: InvestmentInfo) => {
        const nextLevel = getNextLevel(currentLevel);
        if (!nextLevel) return null;

        const nextRequirements = LEVEL_REQUIREMENTS[nextLevel].conditions;
        return {
            maxLine: Math.max(0, nextRequirements.maxLine - investmentInfo.max_line_investment),
            otherLines: Math.max(0, nextRequirements.otherLines - investmentInfo.other_lines_investment)
        };
    };

    // リアルタイムサブスクリプションを設定
    useEffect(() => {
        if (!user?.id) return;

        const subscription = supabase
            .channel('daily-rates-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'daily_rates'
            }, () => {
                // 日利が変更されたらNFTデータを再取得
                fetchNFTs();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            loadPendingRewards()
        }
    }, [user])

    const loadPendingRewards = async () => {
        try {
            if (!user?.id) return;
            
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.email) return;

            // emailでプロファイルを検索
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', authUser.user.email)
                .maybeSingle();

            if (!profile) {
                console.log('Profile not found, skipping rewards fetch');
                setPendingRewards({
                    daily: 0,
                    conquest: 0,
                    total: 0
                });
                return;
            }

            const rewards = await fetchPendingRewards(profile.id);
            setPendingRewards(rewards);
        } catch (error) {
            console.error('Error loading pending rewards:', error);
            setPendingRewards({
                daily: 0,
                conquest: 0,
                total: 0
            });
        }
    };

    // 次のレベルまでの条件を表示するコンポーネント
    const renderNextLevelRequirements = (investmentInfo: InvestmentInfo) => {
        const level = calculateUserLevel({
            personalInvestment: investmentInfo.investment_amount,
            maxLine: investmentInfo.max_line_investment,
            otherLines: investmentInfo.other_lines_investment
        });

        if (level === 'NONE') {
            return (
                <div>
                    <div className="text-gray-400 text-sm mb-2 flex items-center">
                        <ArrowUpCircleIcon className="w-4 h-4 mr-2 text-blue-400" />
                        次のレベルまでの条件
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">必要な最大系列</span>
                            <span className="text-white">
                                ${LEVEL_REQUIREMENTS['ASHIGARU'].conditions.maxLine.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">必要な他系列全体</span>
                            <span className="text-white">
                                ${LEVEL_REQUIREMENTS['ASHIGARU'].conditions.otherLines.toLocaleString()}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-blue-400">
                            次のレベル: 足軽
                        </div>
                    </div>
                </div>
            );
        }

        if (level === 'SHOGUN') {
            return (
                <div className="text-center text-gray-400">
                    最高レベルに到達しています
                </div>
            );
        }

        const levels = ['ASHIGARU', 'BUSHO', 'DAIKANN', 'BUGYO', 'ROJU', 'TAIRO', 'DAIMYO', 'SHOGUN'];
        const levelNames = ['足軽', '武将', '大官', '奉行', '老中', '大老', '大名', '将軍'];
        const currentIndex = levels.indexOf(level);
        const nextLevel = levels[currentIndex + 1];
        const nextLevelName = levelNames[currentIndex + 1];

        return (
            <div>
                <div className="text-gray-400 text-sm mb-2 flex items-center">
                    <ArrowUpCircleIcon className="w-4 h-4 mr-2 text-blue-400" />
                    次のレベルまでの条件
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">必要な最大系列</span>
                        <span className="text-white">
                            ${LEVEL_REQUIREMENTS[nextLevel].conditions.maxLine.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">必要な他系列全体</span>
                        <span className="text-white">
                            ${LEVEL_REQUIREMENTS[nextLevel].conditions.otherLines.toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-2 text-xs text-blue-400">
                        次のレベル: {nextLevelName}
                    </div>
                </div>
            </div>
        );
    };

    // 紹介者数を取得する関数を追加
    const fetchReferralCount = async (userId: string) => {
        try {
            const { data: directReferrals, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('referrer_id', userId);

            if (error) {
                console.error('Error fetching referrals:', error);
                throw error;
            }

            return directReferrals?.length || 0;
        } catch (error) {
            console.error('Error in fetchReferralCount:', error);
            return 0;
        }
    };

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">ダッシュボード</h1>

                    {/* 上部のステータスカード（レベル、総投資額、紹介者数） */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {/* レベルカード */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">現在のレベル</div>
                            <div className="space-y-2">
                                <div className="text-white text-2xl font-bold flex items-baseline space-x-2">
                                    <span className={`font-japanese ${LEVEL_REQUIREMENTS[currentLevel]?.color || 'text-gray-400'}`}>
                                        {LEVEL_REQUIREMENTS[currentLevel]?.name || '--'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    <div>最大系列: ${investmentInfo.max_line_investment.toLocaleString()}</div>
                                    <div>他系列: ${investmentInfo.other_lines_investment.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* 総投資額 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">総投資額</div>
                            <div className="text-white text-2xl font-bold">
                                ${investmentInfo.investment_amount.toLocaleString()}
                            </div>
                        </div>

                        {/* 紹介者数 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">紹介者数</div>
                            <div className="text-white text-2xl font-bold">{referralCount}人</div>
                        </div>
                    </div>

                    {/* 次のレベルと天下統一ボーナス情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
                        {/* 次のレベルまでの条件 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            {renderNextLevelRequirements(investmentInfo)}
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

                    {/* 保留中の報酬 */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">保留中の報酬</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="text-sm text-gray-400 flex items-center mb-2">
                                    <CurrencyYenIcon className="w-4 h-4 mr-2 text-green-400" />
                                    日次報酬
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    ${formatPrice(pendingRewards.daily)}
                                </div>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-4">
                                <div className="text-sm text-gray-400 flex items-center mb-2">
                                    <GiftIcon className="w-4 h-4 mr-2 text-yellow-400" />
                                    天下統一ボーナス
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    ${formatPrice(pendingRewards.conquest)}
                                </div>
                            </div>
                            <div className="bg-blue-600 rounded-lg p-4">
                                <div className="text-sm text-blue-200 flex items-center mb-2">
                                    <ArrowUpCircleIcon className="w-4 h-4 mr-2 text-blue-200" />
                                    合計
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    ${formatPrice(pendingRewards.total)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* NFTリスト */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4">保有NFT</h3>
                        {renderNFTList()}
                    </div>
                </div>
            </main>
        </div>
    );
}