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

// 型定義
interface DashboardData {
    currentLevel: string;
    maxLineInvestment: number;
    otherLinesInvestment: number;
    personalInvestment: number;
    nft_purchase_requests: NFTPurchaseRequest[];
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
const calculateLevel = (info: InvestmentInfo): string => {
    // 最低投資額チェック
    if (!info || info.investment_amount < 1000) {
        return 'NONE';
    }

    // デバッグログを追加
    console.log('Calculating level with info:', {
        investment: info.investment_amount,
        maxLine: info.max_line_investment,
        otherLines: info.other_lines_investment
    });

    const levels = ['SHOGUN', 'DAIMYO', 'TAIRO', 'ROJU', 'BUGYO', 'DAIKANN', 'BUSHO', 'ASHIGARU'];
    
    for (const level of levels) {
        const requirement = LEVEL_REQUIREMENTS[level];
        if (info.max_line_investment >= requirement.conditions.maxLine &&
            info.other_lines_investment >= requirement.conditions.otherLines) {
            console.log(`Level matched: ${level}`);
            return level;
        }
    }
    
    // 最低投資額を満たしていれば足軽
    if (info.investment_amount >= 1000) {
        console.log('Default to ASHIGARU level');
        return 'ASHIGARU';
    }

    console.log('No level matched, returning NONE');
    return 'NONE';
};

interface WeeklyProfit {
    week: string;
    totalProfit: number;
    distributionAmount: number; // 20%
    userShare: number;
}

// 週次利益の分配計算
const calculateWeeklyProfitShare = (weeklyProfit: number, userLevel: string): number => {
    const distributionAmount = weeklyProfit * 0.2; // 20%を分配
    const levelRequirement = LEVEL_REQUIREMENTS[userLevel];
    
    if (!levelRequirement || userLevel === 'NONE') {
        return 0;
    }

    return distributionAmount * (levelRequirement.profitShare / 100);
};

interface NFTData {
    id: string;
    nft_settings: {
        name: string;
        price: number;
        daily_rate: number;
        description?: string;
    };
    approved_at: string | null;
    created_at: string;
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
    const [dailyProfits, setDailyProfits] = useState<DailyProfit[]>([]);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    const fetchNFTs = useCallback(async (userId: string) => {
        try {
            const { data: nftData, error: nftError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
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
                .eq('status', 'approved');

            if (nftError) throw nftError;

            // 型アサーションを使用して安全に処理
            setUserNFTs((nftData as NFTData[] || []).map(item => ({
                id: item.id,
                name: item.nft_settings.name || 'SHOGUN NFT',
                price: Number(item.nft_settings.price),
                daily_rate: Number(item.nft_settings.daily_rate || 0.01),
                image_url: '/images/nft3000.png',
                description: item.nft_settings.description || '',
                purchase_date: item.approved_at || item.created_at
            })));

            return { nfts: nftData as NFTData[], requests: nftData || [] };

        } catch (error) {
            console.error('Error in fetchNFTs:', error);
            return { nfts: [], requests: [] };
        }
    }, []);

    useEffect(() => {
        const loadNFTs = async () => {
            if (!user?.id) return;
            const { nfts } = await fetchNFTs(user.id);
            setUserNFTs(nfts.map(item => ({
                id: item.id,
                name: item.nft_settings.name || 'SHOGUN NFT',
                price: Number(item.nft_settings.price),
                daily_rate: Number(item.nft_settings.daily_rate || 0.01),
                image_url: '/images/nft3000.png',
                description: item.nft_settings.description || '',
                purchase_date: item.approved_at || item.created_at
            })));
        };

        loadNFTs();
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

    // initializeDashboard関数を修正
    const initializeDashboard = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            setUser(session.user);

            // プロフィール情報を取得
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                return;
            }

            // NFTの投資額を取得
            const { data: nftData, error: nftError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    nft_settings (
                        price,
                        daily_rate
                    ),
                    created_at,
                    approved_at
                `)
                .eq('user_id', session.user.id)
                .eq('status', 'approved');

            if (nftError) {
                console.error('NFT fetch error:', nftError);
                return;
            }

            // 投資額を計算
            const totalInvestment = (nftData || []).reduce((sum, item) => 
                sum + (Number(item.nft_settings?.price) || 0), 0);

            // 投資データを設定
            const investmentData = {
                investment_amount: totalInvestment,
                max_line_investment: profile?.max_line_investment || 0,
                other_lines_investment: profile?.other_lines_investment || 0
            };

            console.log('Investment data:', investmentData);

            // レベルを計算
            const level = calculateLevel(investmentData);
            console.log('Calculated level:', level);

            // 状態を更新
            setInvestmentInfo(investmentData);
            setCurrentLevel(level);
            setUserNFTs(nftData?.map(item => ({
                id: item.id,
                name: item.nft_settings.name || 'SHOGUN NFT',
                price: Number(item.nft_settings.price),
                daily_rate: Number(item.nft_settings.daily_rate || 0.01),
                image_url: '/images/nft3000.png',
                description: item.nft_settings.description || '',
                purchase_date: item.approved_at || item.created_at
            })) || []);

            // プロフィールを更新
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    investment_amount: totalInvestment,
                    max_line_investment: investmentData.max_line_investment,
                    other_lines_investment: investmentData.other_lines_investment
                })
                .eq('id', session.user.id);

            if (updateError) {
                console.error('Error updating profile:', updateError);
            }

            // 紹介者数を取得
            const { data: referrals, error: referralError } = await supabase
                .from('profiles')
                .select('id')
                .eq('referrer_id', session.user.id);

            if (!referralError) {
                setReferralCount(referrals?.length || 0);
            }

        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }, [router]);

    // useEffectを修正
    useEffect(() => {
        initializeDashboard();
    }, [initializeDashboard]);

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

    // レベル情報の永続化のための修正
    useEffect(() => {
        const loadOrganizationData = async () => {
            if (!user?.id) return;
            
            try {
                // プロフィール情報を取得
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    return;
                }

                // NFTの投資額を取得
                const { data: nftData, error: nftError } = await supabase
                    .from('nft_purchase_requests')
                    .select(`
                        id,
                        nft_settings (
                            price
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('status', 'approved');

                if (nftError) {
                    console.error('NFT fetch error:', nftError);
                    return;
                }

                // 投資額を計算
                const totalInvestment = (nftData || []).reduce((sum, item) => 
                    sum + (Number(item.nft_settings?.price) || 0), 0);

                // 投資データを設定
                const investmentData = {
                    investment_amount: totalInvestment,
                    max_line_investment: profile.max_line_investment || 4000,
                    other_lines_investment: profile.other_lines_investment || 3000
                };

                // レベルを計算
                const level = calculateLevel(investmentData);

                // 状態を更新
                setInvestmentInfo(investmentData);
                setCurrentLevel(level);

                // プロフィールを更新
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                        investment_amount: totalInvestment,
                        max_line_investment: investmentData.max_line_investment,
                        other_lines_investment: investmentData.other_lines_investment
                    })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error updating profile:', updateError);
                }

                // NFTデータを取得して表示を更新
                await fetchNFTs(user.id);

            } catch (error) {
                console.error('Error loading organization data:', error);
            }
        };

        loadOrganizationData();
    }, [user?.id, fetchNFTs]);

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

                    // レベル情報を設定
                    const stats = calculateUserStats({
                        personalInvestment: investmentInfo.investment_amount,
                        maxLine: investmentInfo.max_line_investment,
                        otherLines: investmentInfo.other_lines_investment
                    });
                    setLevelInfo({
                        max_line_investment: stats.maxLine,
                        other_lines_investment: stats.otherLines,
                        investment_amount: stats.personalInvestment
                    });
                    setCurrentLevel(stats.currentLevel || '--');
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

    // NFTカードの表示部分を修正（待機期間の追加）
    const renderNFTList = () => {
        if (!userNFTs || userNFTs.length === 0) {
            return <div className="text-center text-gray-400">NFTを所有していません</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {userNFTs.map((nft: NFT) => (
                    <div key={nft.id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="relative">
                            <div className="aspect-w-1 aspect-h-1">
                                <img
                                    src="/images/nft3000.png"
                                    alt={nft.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-gray-900 bg-opacity-75 rounded text-xs text-green-400">
                                日利 {(Number(nft.daily_rate) * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs">価格</p>
                                    <p className="text-white font-medium">
                                        {Number(nft.price).toLocaleString()} USDT
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400 mt-2 pb-2 border-t border-gray-700 pt-2">
                                購入日: {formatDateToJST(nft.purchase_date)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

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
                    nft_settings!inner (
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

    // ダッシュボードデータの取得
    const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
        try {
            // プロフィールとNFTデータを取得
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    nft_purchase_requests (
                        id,
                        status,
                        nft_settings!inner (
                            id,
                            name,
                            price
                        )
                    )
                `)
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // 組織ツリーを構築して最大系列と他系列を取得
            const organizationData = await buildOrganizationTree(userId);

            // レベル判定用のデータを構築
            const memberData = {
                ...profile,
                max_line_investment: organizationData.max_line_investment,
                other_lines_investment: organizationData.other_lines_investment,
                investment_amount: profile.investment_amount,
                nft_purchase_requests: profile.nft_purchase_requests
            };

            return {
                currentLevel: getLevelLabel(memberData),
                maxLineInvestment: organizationData.max_line_investment,
                otherLinesInvestment: organizationData.other_lines_investment,
                personalInvestment: profile.investment_amount,
                nft_purchase_requests: profile.nft_purchase_requests
            };
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
            throw error;
        }
    };

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

                const data = await fetchDashboardData(profile.id);
                setDashboardData(data);
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

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">ダッシュボード</h1>
                    
                    {/* 上部のステータスカード */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

                        {/* 保有中の報酬 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">保有中の報酬</div>
                            <div className="text-white text-2xl font-bold">$0</div>
                        </div>

                        {/* 紹介者数 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">紹介者数</div>
                            <div className="text-white text-2xl font-bold">{referralCount}人</div>
                        </div>

                        {/* 最終報酬日 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm">最終報酬日</div>
                            <div className="text-white text-2xl font-bold">-</div>
                        </div>
                    </div>

                    {/* 次のレベルと天下統一ボーナス情報 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {/* 次のレベルまでの条件 */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-2 flex items-center">
                                <ArrowUpCircleIcon className="w-4 h-4 mr-2 text-blue-400" />
                                次のレベルまでの条件
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">現在のレベル</span>
                                <span className={`text-lg font-bold ${LEVEL_REQUIREMENTS[currentLevel]?.color}`}>
                                    {LEVEL_REQUIREMENTS[currentLevel]?.name}
                                </span>
                            </div>
                            {(() => {
                                const nextRequirements = calculateNextLevelRequirements(currentLevel, investmentInfo);
                                const nextLevel = getNextLevel(currentLevel);
                                
                                if (!nextRequirements || !nextLevel) {
                                    return (
                                        <div className="text-sm text-gray-400">
                                            最高レベルに到達しています
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">必要な最大系列</span>
                                            <span className="text-white">
                                                ${nextRequirements.maxLine.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">必要な他系列全体</span>
                                            <span className="text-white">
                                                ${nextRequirements.otherLines.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-blue-400">
                                            次のレベル: {LEVEL_REQUIREMENTS[nextLevel].name}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* 天下統一ボーナス */}
                        <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-gray-400 text-sm mb-2 flex items-center">
                                <CurrencyYenIcon className="w-4 h-4 mr-2 text-yellow-400" />
                                天下統一ボーナス
                            </div>
                            <div className="text-2xl font-bold text-white mb-2">
                                $0
                            </div>
                            <div className="text-sm text-gray-400">
                                今週の獲得予定ボーナス
                            </div>
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

                    {/* NFTリスト（既存のコード） */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-white mb-4">保有NFT</h3>
                        {renderNFTList()}
                    </div>
                </div>
            </main>
        </div>
    );
}