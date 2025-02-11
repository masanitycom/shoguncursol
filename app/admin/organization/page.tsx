'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { TreeChart } from '@/app/organization/components/TreeChart'
import { useAuth } from '@/lib/auth'
import { Member } from '@/app/types/organization'

interface OrganizationProps {
    members: Member[]
}

export default function AdminOrganizationPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [organization, setOrganization] = useState<Member[] | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalInvestment: 0,
        totalUsers: 0
    })

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
                    .select('id', { 
                        count: 'exact',
                        head: true 
                    })

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

    const buildOrganizationTree = (users: any[]): Member[] => {
        const nodes = new Map<string, Member>();
        const roots: Member[] = [];

        try {
            // 各ユーザーをノードに変換
            users.forEach(user => {
                const userNode: Member = {
                    id: user.id,
                    display_id: user.display_id || user.id.slice(0, 8),
                    name: user.name || 'Unknown',
                    email: user.email || '',
                    name_kana: user.name_kana || '',
                    display_name: user.display_id || user.id.slice(0, 8),
                    investment_amount: Number(user.investment_amount) || 0,
                    level: user.level || 0,
                    referrer_id: user.referrer_id,
                    children: [],
                    total_team_investment: Number(user.investment_amount) || 0
                };
                nodes.set(user.id, userNode);
            });

            // ツリー構造を構築
            users.forEach(user => {
                const node = nodes.get(user.id);
                if (node) {
                    if (user.referrer_id && nodes.has(user.referrer_id)) {
                        // 親ノードが存在する場合、その子として追加
                        const parent = nodes.get(user.referrer_id);
                        if (parent) {
                            parent.children.push(node);
                        }
                    } else {
                        // 親がいない場合はルートノードとして追加
                        roots.push(node);
                    }
                }
            });

            return roots;
        } catch (error) {
            console.error('Error building organization tree:', error);
            return [];
        }
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                    router.push('/admin/login');
                    return;
                }

                setUser(session.user);

                // すべてのユーザーを取得
                const { data: users, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at');

                if (error) throw error;

                // ユーザー配列を使用してツリーを構築
                const rootUsers = buildOrganizationTree(users || []);
                console.log('Organization data:', rootUsers);
                setOrganization(rootUsers);

                // 統計情報を更新
                const totalInvestment = users?.reduce((sum, user) => 
                    sum + Number(user.investment_amount || 0), 0) || 0;

                setStats({
                    totalInvestment,
                    totalUsers: users?.length || 0
                });
            } catch (error) {
                console.error('Error initializing:', error);
                setError('データの取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

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
                                <TreeChart key={member.id} member={member} />
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
    );
} 