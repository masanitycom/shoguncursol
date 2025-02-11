'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import { TreeChart } from './components/TreeChart'
import { calculateUserLevel } from '@/lib/utils/calculateUserLevel'
import { Member, OrganizationNode } from '@/app/types/organization'

interface OrganizationMember {
    id: string
    name: string
    email: string
    level: number
    referrer_id: string | null
    investment_amount: number
}

export default function OrganizationPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [organization, setOrganization] = useState<OrganizationNode | null>(null)
    const [members, setMembers] = useState<OrganizationMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [levelInfo, setLevelInfo] = useState<any>(null)
    const [stats, setStats] = useState({
        totalInvestment: 0,
        totalUsers: 0
    })

    useEffect(() => {
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            try {
                // キャッシュを避けるためにオプションを使用
                const organization = await fetchOrganization(session.user.id);
                setOrganization(organization);
            } catch (error) {
                console.error('Error initializing:', error);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [router]);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.id) return

            try {
                // 総投資額を取得
                const { data: users, error: usersError } = await supabase
                    .from('users')
                    .select('investment_amount')

                if (usersError) throw usersError

                const totalInvestment = users.reduce((sum, user) => 
                    sum + Number(user.investment_amount || 0), 0)

                // 総ユーザー数を取得
                const { count, error: countError } = await supabase
                    .from('users')
                    .select('*', { count: 'exact', head: true });

                if (countError) throw countError

                setStats({
                    totalInvestment,
                    totalUsers: count || 0
                })
            } catch (error) {
                console.error('Error fetching stats:', error)
            }
        }

        fetchStats()
    }, [])

    const fetchOrganization = async (userId: string): Promise<OrganizationNode> => {
        try {
            const { data: orgData, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            const childNodes = await fetchChildren(userId);
            const investment = Number(orgData.investment_amount) || 0;
            const total_team_investment = childNodes.reduce((sum, node) => 
                sum + (node.investment_amount || 0), 0);

            // OrganizationNode型として返す
            return {
                id: orgData.id,
                display_id: orgData.display_id || orgData.id.slice(0, 8),
                name: orgData.name || orgData.email || 'Unknown',
                email: orgData.email || '',
                name_kana: orgData.name_kana || '',
                display_name: orgData.display_id || orgData.id.slice(0, 8),
                investment_amount: investment,
                level: orgData.level || 0,
                referrer_id: orgData.referrer_id,
                children: childNodes,
                total_team_investment,
                maxLine: 0,
                otherLines: 0
            };
        } catch (error) {
            console.error('Error fetching organization:', error);
            throw error;
        }
    };

    const fetchChildren = async (userId: string): Promise<OrganizationNode[]> => {
        try {
            const { data: children, error } = await supabase
                .from('users')
                .select(`
                    id,
                    email,
                    name,
                    display_id,
                    name_kana,
                    level,
                    referrer_id,
                    investment_amount
                `)
                .eq('referrer_id', userId);

            if (error) throw error;

            // 再帰的に子ノードを取得
            const childNodes = await Promise.all(
                children?.map(async (child) => {
                    const grandChildren = await fetchChildren(child.id);
                    const total_team_investment = grandChildren.reduce(
                        (sum, node) => sum + (node.investment_amount || 0),
                        Number(child.investment_amount || 0)
                    );

                    return {
                        id: child.id,
                        display_id: child.display_id || child.id.slice(0, 8),
                        name: child.name || child.email,
                        email: child.email,
                        name_kana: child.name_kana || '',
                        display_name: child.display_id || child.id.slice(0, 8),
                        investment_amount: Number(child.investment_amount) || 0,
                        level: child.level || 0,
                        referrer_id: child.referrer_id,
                        children: grandChildren,
                        total_team_investment,
                        maxLine: 0,
                        otherLines: 0
                    };
                }) || []
            );

            return childNodes;
        } catch (error) {
            console.error('Error fetching children:', error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
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

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8 overflow-x-auto">
                <h1 className="text-3xl font-bold text-white mb-8">組織図</h1>

                <div className="min-w-max">
                    {organization ? (
                        <TreeChart member={organization} isUserView={true} />
                    ) : (
                        <div className="text-center text-gray-400">
                            データがありません
                        </div>
                    )}
                </div>

                <div className="mt-4 text-gray-400">
                    <p>※ 最大系列・他系列の投資額には自身の投資額（NFT）は含まれません</p>
                </div>
            </main>
        </div>
    )
} 