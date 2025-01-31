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

interface DashboardStats {
    totalUsers: number
    activeUsers: number
    totalInvestment: number
    monthlyRevenue: number
    pendingPurchases: number
    pendingAirdrops: number
}

export default function AdminDashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalInvestment: 0,
        monthlyRevenue: 0,
        pendingPurchases: 0,
        pendingAirdrops: 0
    })
    const [loading, setLoading] = useState(true)

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
            // ユーザー統計
            const { data: users } = await supabase
                .from('users')
                .select('*')

            // NFT購入申請
            const { data: purchases } = await supabase
                .from('nft_purchases')
                .select('*, nft_master(*)')
                .eq('status', 'pending')

            // エアドロップ申請
            const { data: airdrops } = await supabase
                .from('task_responses')
                .select('*')
                .eq('status', 'pending')

            setStats({
                totalUsers: users?.length || 0,
                activeUsers: users?.filter(u => u.status === 'active').length || 0,
                totalInvestment: users?.reduce((sum, u) => sum + (u.investment_amount || 0), 0) || 0,
                monthlyRevenue: 0, // 別途計算ロジックが必要
                pendingPurchases: purchases?.length || 0,
                pendingAirdrops: airdrops?.length || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
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
                            title="保留中のNFT購入"
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
    icon?: any
    href?: string
    highlight?: boolean
}

function StatCard({ title, value, loading, prefix, suffix, icon: Icon, href, highlight }: StatCardProps) {
    const CardWrapper = href ? Link : 'div'
    
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
                                {prefix}{value.toLocaleString()}{suffix}
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