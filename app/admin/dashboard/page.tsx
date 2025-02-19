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
    GiftIcon
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
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalInvestment: 0
    })
    const [loading, setLoading] = useState(true)
    const [pendingPurchases, setPendingPurchases] = useState<NFTPurchaseRequest[]>([])

    useEffect(() => {
        checkAuth()
        fetchDashboardStats()
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
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    investment_amount,
                    level
                `)

            if (error) throw error

            // 総投資額の計算（数値型に変換して計算）
            const totalInvestment = data?.reduce((sum, user) => 
                sum + (Number(user.investment_amount) || 0), 0) || 0

            // アクティブユーザー数（投資額が0より大きいユーザー）
            const activeUsers = data?.filter(user => 
                Number(user.investment_amount) > 0).length || 0

            // 統計情報を更新
            setStats({
                totalInvestment,
                totalUsers: data?.length || 0,
                activeUsers
            })

        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

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
                            value={stats.pendingPurchases}
                            loading={loading}
                            suffix="件"
                            icon={ShoppingCartIcon}
                            href="/admin/nfts/purchase-requests"
                            highlight={stats.pendingPurchases > 0}
                        />
                        <StatCard
                            title="保留中のエアドロ申請"
                            value={stats.pendingAirdrops}
                            loading={loading}
                            suffix="件"
                            icon={GiftIcon}
                            href="/admin/rewards/manage"
                            highlight={stats.pendingAirdrops > 0}
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