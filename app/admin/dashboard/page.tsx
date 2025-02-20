'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'
import {
    UsersIcon,
    UserGroupIcon,
    BanknotesIcon,
    ChartBarIcon,
    ShoppingCartIcon,
    GiftIcon,
    CheckCircleIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'
import { IconType } from 'react-icons'

interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    owner_id: string | null;
    status: string | null;
    description: string | null;
}

interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    payment_method: string;
    nfts: NFTSettings[];  // 配列として定義
}

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalInvestment: number;
    monthlyRevenue?: number;      // オプショナルに変更
    pendingPurchases?: number;    // オプショナルに変更
    pendingAirdrops?: number;     // オプショナルに変更
}

interface NFTPurchaseRequest {
    id: string
    user_id: string
    nft_id: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    nfts?: {
        id: string
        name: string
        price: number
        daily_rate: number
        image_url: string | null
    }
}

export const dynamic = 'force-dynamic'

export default function AdminDashboardPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalInvestment: 0,
        monthlyRevenue: 0,
        nftRequests: 0,
        airdropRequests: 0
    })
    const [loading, setLoading] = useState(true)
    const [pendingPurchases, setPendingPurchases] = useState<NFTPurchaseRequest[]>([])
    const [pendingRewards, setPendingRewards] = useState<any[]>([])

    useEffect(() => {
        const init = async () => {
            await checkAuth()
            await fetchDashboardStats()
        }
        init()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            
            // 各種統計情報を並列で取得
            const [userCount, nftRequestCount, profilesData] = await Promise.all([
                fetchUserCount(),
                fetchNFTPurchaseRequestCount(),
                supabase
                    .from('profiles')
                    .select('investment_amount')
            ]);

            // NFTデータから総投資額を計算
            const { data: nftData } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    status,
                    nft_settings!inner (
                        price
                    )
                `)
                .eq('status', 'approved');

            // 総投資額の計算
            const totalInvestment = (nftData || []).reduce((sum, nft) => 
                sum + (Number(nft.nft_settings?.price) || 0), 0);

            // アクティブユーザー（NFTを保有しているユーザー）
            const { data: activeUserData, count: activeCount } = await supabase
                .from('nft_purchase_requests')
                .select('user_id', { count: 'exact', head: true })
                .eq('status', 'approved');

            // エアドロップ申請数を取得
            const { count: airdropCount } = await supabase
                .from('task_responses')
                .select('*', { count: 'exact' })
                .eq('status', 'pending');

            // 統計情報を更新
            setStats({
                totalUsers: userCount,
                activeUsers: activeCount || 0,
                totalInvestment,
                monthlyRevenue: 0, // 必要に応じて計算
                nftRequests: nftRequestCount,
                airdropRequests: airdropCount || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingPurchases = async () => {
        try {
            const { data: purchases, error } = await supabase
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
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(5)

            if (error) throw error

            // 型アサーションを使用して、データが期待する形式であることを保証
            setPendingPurchases(purchases as NFTPurchaseRequest[])

        } catch (error) {
            console.error('Error fetching pending purchases:', error)
        }
    }

    const fetchAirdrops = async () => {
        try {
            const { data, error } = await supabase
                .from('task_responses')
                .select('*')
                .eq('status', 'pending')

            if (error) throw error

            return data || []

        } catch (error) {
            console.error('Error fetching airdrops:', error)
            return []
        }
    }

    const calculateTotalInvestment = (purchases: PurchaseRequest[] | null) => {
        if (!purchases || purchases.length === 0) return 0;
        return purchases.reduce((total, purchase) => {
            const price = purchase.nfts[0]?.price;  // 配列の最初の要素を使用
            return total + (price || 0);
        }, 0);
    }

    const fetchUserCount = async () => {
        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' });  // count: 'exact' を追加

        if (error) {
            console.error('Error fetching user count:', error);
            return 0;
        }

        return count || 0;
    };

    const fetchNFTPurchaseRequestCount = async () => {
        const { data, error, count } = await supabase
            .from('nft_purchase_requests')
            .select('*', { count: 'exact' })
            .eq('status', 'pending');  // pending状態のみカウント

        if (error) {
            console.error('Error fetching NFT purchase requests:', error);
            return 0;
        }

        return count || 0;
    };

    const fetchPendingRewards = async () => {
        const currentWeek = getCurrentWeek();
        
        // 未払いの報酬を取得
        const { data: rewards, error } = await supabase
            .from('weekly_rewards')
            .select(`
                id,
                week_id,
                start_date,
                end_date,
                total_amount,
                status,
                user_rewards (
                    user_id,
                    display_id,
                    amount,
                    nft_count
                )
            `)
            .eq('status', 'pending')
            .order('start_date', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching rewards:', error);
            return [];
        }

        return rewards;
    };

    const handlePayRewards = async (weekId: string) => {
        // Implementation of handlePayRewards function
    };

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">管理者ダッシュボード</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="総ユーザー数"
                            value={stats.totalUsers}
                            loading={loading}
                            suffix="人"
                            icon={UsersIcon}
                            href="/admin/users"
                        />
                        <StatCard
                            title="アクティブユーザー"
                            value={stats.activeUsers}
                            loading={loading}
                            suffix="人"
                            icon={UserGroupIcon}
                        />
                        <StatCard
                            title="総投資額"
                            value={stats.totalInvestment}
                            loading={loading}
                            prefix="$"
                            icon={BanknotesIcon}
                        />
                        <StatCard
                            title="月間収益"
                            value={stats.monthlyRevenue}
                            loading={loading}
                            prefix="$"
                            icon={ChartBarIcon}
                        />
                        <StatCard
                            title="NFT購入申請"
                            value={stats.nftRequests}
                            loading={loading}
                            suffix="件"
                            icon={ShoppingCartIcon}
                            href="/admin/nfts/purchase-requests"
                            highlight={stats.nftRequests > 0}
                        />
                        <StatCard
                            title="保留中のエアドロ申請"
                            value={stats.airdropRequests}
                            loading={loading}
                            suffix="件"
                            icon={GiftIcon}
                            href="/admin/rewards/manage"
                            highlight={stats.airdropRequests > 0}
                        />
                    </div>

                    <div className="mt-8">
                        <RewardsSummaryCard 
                            pendingRewards={pendingRewards}
                            onPayRewards={handlePayRewards}
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}

interface StatCardProps {
    title: string
    value: number
    loading: boolean
    prefix?: string
    suffix?: string
    icon?: IconType
    href?: string
    highlight?: boolean
}

const StatCard = ({ title, value, loading, prefix, suffix, icon: Icon, href, highlight }: StatCardProps) => {
    const CardWrapper = href ? Link : 'div'
    
    const displayValue = value ?? 0  // または適切なデフォルト値
    
    return (
        <CardWrapper
            href={href || '#'}
            className={`bg-gray-800 p-6 rounded-lg shadow-lg transition-all duration-200 
                ${href ? 'hover:bg-gray-700 cursor-pointer' : ''}
                ${highlight ? 'ring-2 ring-blue-500' : ''}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-gray-400 text-lg mb-2">{title}</h3>
                    <p className="text-3xl font-bold text-white">
                        {loading ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            <>
                                {prefix}{displayValue.toLocaleString()}{suffix}
                            </>
                        )}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    {Icon && (
                        <Icon className="w-8 h-8 text-gray-500 mb-2" />
                    )}
                    {href && (
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200">
                            詳細を表示
                        </button>
                    )}
                </div>
            </div>
        </CardWrapper>
    )
}

interface RewardsSummaryCardProps {
    pendingRewards: any[];
    onPayRewards: (weekId: string) => void;
}

const RewardsSummaryCard = ({ pendingRewards, onPayRewards }: RewardsSummaryCardProps) => {
    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">未払い報酬</h2>
                <Link 
                    href="/admin/rewards"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                >
                    <ListBulletIcon className="w-4 h-4" />
                    <span>詳細を表示</span>
                </Link>
            </div>

            {pendingRewards.length > 0 ? (
                <div className="space-y-4">
                    {pendingRewards.map((week) => (
                        <div key={week.id} className="bg-gray-700/50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-white font-medium">
                                        {formatDate(week.start_date)} 〜 {formatDate(week.end_date)}
                                    </div>
                                    <div className="text-gray-400 text-sm mt-1">
                                        対象ユーザー: {week.user_count}人
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">
                                        ${week.total_amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                <div className="bg-gray-800/50 p-2 rounded">
                                    <div className="text-gray-400">日次報酬</div>
                                    <div className="text-white">
                                        ${week.daily_rewards_amount.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 p-2 rounded">
                                    <div className="text-gray-400">天下統一ボーナス</div>
                                    <div className="text-white">
                                        ${week.conquest_rewards_amount.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 p-2 rounded">
                                    <div className="text-gray-400">エアドロップ</div>
                                    <div className="text-white">
                                        ${week.airdrop_amount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onPayRewards(week.id)}
                                className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 
                                         text-white rounded-lg flex items-center gap-2 ml-auto"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>支払い実行</span>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 text-center py-8">
                    未払いの報酬はありません
                </div>
            )}
        </div>
    )
} 