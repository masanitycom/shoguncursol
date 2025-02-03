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

interface NFT {
    id: string;
    name: string;
    price: number;
}

interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    nfts: NFT | null;  // nullableな単一のNFTオブジェクト
}

interface DashboardStats {
    totalUsers: number
    activeUsers: number
    totalInvestment: number
    monthlyRevenue: number
    pendingPurchases: number
    pendingAirdrops: number
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
            // ユーザー情報の取得
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*')

            if (usersError) throw usersError

            // NFT購入情報のクエリを修正（nft_master → nfts）
            const { data: nftPurchases, error: purchasesError } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    user_id,
                    nft_id,
                    status,
                    created_at,
                    nfts!inner (
                        id,
                        name,
                        price
                    )
                `) as { data: PurchaseRequest[] | null, error: any }

            if (purchasesError) {
                console.error('NFT Purchases Error:', purchasesError)
                throw purchasesError
            }

            console.log('Raw NFT Purchases:', nftPurchases)
            console.log('Purchase Count:', nftPurchases?.length || 0)
            
            // 型アサーションを追加してクエリ結果の型を明示
            if (nftPurchases && nftPurchases.length > 0) {
                nftPurchases.forEach((purchase: PurchaseRequest) => {
                    console.log('Purchase Detail:', {
                        purchaseId: purchase.id,
                        userId: purchase.user_id,
                        nftMasterId: purchase.nft_id,
                        price: purchase.nfts?.price,
                        status: purchase.status
                    })
                })
            }

            // ユーザーごとの投資額計算
            const userInvestments = nftPurchases?.reduce((acc, purchase) => {
                const userId = purchase.user_id
                const price = purchase.nfts?.price
                console.log(`Processing purchase for user ${userId} with price ${price}`)
                
                if (price) {
                    acc[userId] = (acc[userId] || 0) + Number(price)
                    console.log(`Updated investment for user ${userId} to ${acc[userId]}`)
                }
                return acc
            }, {} as Record<string, number>) || {}

            console.log('Final User Investments:', userInvestments)

            const totalInvestment = Object.values(userInvestments).reduce((sum, amount) => {
                console.log(`Adding amount ${amount} to sum ${sum}`)
                return sum + amount
            }, 0)

            console.log('Final Total Investment:', totalInvestment)

            setStats({
                totalUsers: users?.length || 0,
                activeUsers: users?.filter(u => u.active).length || 0,
                totalInvestment: totalInvestment || 0,
                monthlyRevenue: 0,
                pendingPurchases: 0,
                pendingAirdrops: 0
            })

            // 保留中の申請も同様に修正
            await fetchPendingPurchases()
            const airdrops = await fetchAirdrops()

            setStats(prev => ({
                ...prev,
                pendingPurchases: pendingPurchases.length,
                pendingAirdrops: airdrops.length
            }))

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