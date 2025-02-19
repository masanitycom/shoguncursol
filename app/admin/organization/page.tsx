'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { TreeChart } from '@/app/organization/components/TreeChart'
import { useAuth } from '@/lib/auth'

interface Member {
    id: string;
    display_id: string;
    name: string;
    name_kana?: string;
    email: string;
    display_name: string;
    level: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    children: Member[];
}

interface NFTSettings {
    id: string;
    price: string;
}

interface NFTData {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    nft_settings: NFTSettings;
}

// レベル計算用の定数
const LEVEL_THRESHOLDS = {
    NONE: 0,
    BRONZE: 3000,
    SILVER: 10000,
    GOLD: 30000,
    PLATINUM: 100000,
    DIAMOND: 300000
};

// レベル計算関数
const calculateLevel = (investment: number): string => {
    if (investment >= LEVEL_THRESHOLDS.DIAMOND) return 'diamond';
    if (investment >= LEVEL_THRESHOLDS.PLATINUM) return 'platinum';
    if (investment >= LEVEL_THRESHOLDS.GOLD) return 'gold';
    if (investment >= LEVEL_THRESHOLDS.SILVER) return 'silver';
    if (investment >= LEVEL_THRESHOLDS.BRONZE) return 'bronze';
    return 'none';
};

export default function AdminOrganizationPage() {
    const router = useRouter()
    const { handleLogout, user } = useAuth()
    const [organization, setOrganization] = useState<Member[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalInvestment: 0,
        totalUsers: 0
    })

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // 全ユーザーのプロフィールを取得
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')

                if (profileError) throw profileError
                
                // デバッグ用にデータを出力
                console.log('User data with referrers:', profiles)

                // 組織ツリーを構築
                const organizationTree = await buildOrganizationTree(profiles)
                
                // 統計情報の計算
                const totalInvestment = organizationTree.reduce((sum, member) => 
                    sum + member.investment_amount, 0)
                const totalUsers = organizationTree.length

                setStats({
                    totalInvestment,
                    totalUsers
                })

                setOrganization(organizationTree)
            } catch (error) {
                console.error('Error fetching users:', error)
                setError('Failed to fetch organization data')
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    const buildOrganizationTree = async (profiles: any[]): Promise<Member[]> => {
        try {
            // ルートノード（referrer_idがnull）を見つける
            const rootNodes = profiles.filter(p => !p.referrer_id)

            const buildTree = async (node: any): Promise<Member> => {
                const children = await Promise.all(
                    profiles
                        .filter(p => p.referrer_id === node.id)
                        .map(child => buildTree(child))
                )

                // NFTデータを取得
                const { data: nftData, error: nftError } = await supabase
                    .from('nft_purchase_requests')
                    .select(`
                        id,
                        status,
                        nft_settings (
                            id,
                            price
                        )
                    `)
                    .eq('user_id', node.id)
                    .eq('status', 'approved')

                if (nftError) throw nftError

                // 投資額を計算
                const investment = (nftData || []).reduce((sum: number, nft: any) => {
                    return sum + Number(nft.nft_settings?.price || 0)
                }, 0)

                // 子ノードの投資額を合算
                const totalTeamInvestment = investment + children.reduce((sum, child) => 
                    sum + child.total_team_investment, 0
                )

                return {
                    id: node.id,
                    display_id: node.display_id,
                    name: node.name || node.display_id,
                    name_kana: node.name_kana || '',
                    email: node.email || '',
                    display_name: node.display_name || '',
                    level: calculateLevel(investment),
                    investment_amount: investment,
                    max_line_investment: node.max_line_investment || 0,
                    other_lines_investment: node.other_lines_investment || 0,
                    total_team_investment: totalTeamInvestment,
                    referrer_id: node.referrer_id,
                    children: children
                }
            }

            return await Promise.all(rootNodes.map(node => buildTree(node)))
        } catch (error) {
            console.error('Error building organization tree:', error)
            throw error
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user}
                isAdmin={true}
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8 overflow-x-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">組織図</h1>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-gray-400 text-sm">総投資額</h3>
                            <p className="text-2xl font-bold text-white">
                                ${stats.totalInvestment.toLocaleString()} USDT
                            </p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h3 className="text-gray-400 text-sm">総ユーザー数</h3>
                            <p className="text-2xl font-bold text-white">
                                {stats.totalUsers.toLocaleString()}名
                            </p>
                        </div>
                    </div>
                    <div className="min-w-max space-y-8">
                        {organization && Array.isArray(organization) ? (
                            organization.map(member => (
                                <TreeChart 
                                    key={member.id} 
                                    member={member}
                                    depth={0}
                                    maxDepth={3}
                                    isUserView={false}
                                />
                            ))
                        ) : (
                            <div className="text-center text-gray-400">
                                データがありません
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
} 