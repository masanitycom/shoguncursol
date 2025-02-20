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
    status: string;
    nft_settings: {
        id: string;
        name: string;
        price: number;
    };
}

// 正しいレベル要件の定義
const LEVEL_REQUIREMENTS = {
    NONE: {
        requiredNFT: 'NONE',
        totalInvestment: 0
    },
    ASHIGARU: {
        requiredNFT: 'SHOGUN NFT1000',
        totalInvestment: 1000
    },
    BUSHO: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 3000,
        otherLinesInvestment: 1500
    },
    DAIKAN: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 5000,
        otherLinesInvestment: 2500
    },
    BUGYO: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 10000,
        otherLinesInvestment: 5000
    },
    ROJU: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 50000,
        otherLinesInvestment: 25000
    },
    TAIRO: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 100000,
        otherLinesInvestment: 50000
    },
    DAIMYO: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 300000,
        otherLinesInvestment: 150000
    },
    SHOGUN: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 600000,
        otherLinesInvestment: 500000
    }
};

// 総投資額と総ユーザー数の再帰的計算
const calculateTotalStats = (members: Member[]): { investment: number, users: number } => {
    return members.reduce((acc, member) => {
        const childStats = calculateTotalStats(member.children);
        return {
            investment: acc.investment + member.investment_amount + childStats.investment,
            users: acc.users + 1 + childStats.users
        };
    }, { investment: 0, users: 0 });
};

// レベル計算関数の修正
const calculateLevel = async (node: any): Promise<string> => {
    // NFTデータを取得
    const { data: nftData } = await supabase
        .from('nft_purchase_requests')
        .select(`
            id,
            status,
            nft_settings (
                id,
                name,
                price
            )
        `)
        .eq('user_id', node.id)
        .eq('status', 'approved');

    // NFT要件チェックの部分を修正
    const hasRequiredNFT = (nftData || []).some((nft: any) => {
        const nftSettings = nft.nft_settings;
        if (!nftSettings || typeof nftSettings.price !== 'number') {
            return false;
        }
        return nftSettings.price >= 1000;
    });

    if (!hasRequiredNFT) return 'NONE';

    // 投資額とライン投資額を使用してレベルを判定
    const maxLineInvestment = node.max_line_investment || 0;
    const otherLinesInvestment = node.other_lines_investment || 0;
    const teamInvestment = node.total_team_investment || 0;

    // 武将以上の判定
    if (maxLineInvestment >= 3000 && otherLinesInvestment >= 1500) {
        if (maxLineInvestment >= 600000 && otherLinesInvestment >= 500000) return 'SHOGUN';
        if (maxLineInvestment >= 300000 && otherLinesInvestment >= 150000) return 'DAIMYO';
        if (maxLineInvestment >= 100000 && otherLinesInvestment >= 50000) return 'TAIRO';
        if (maxLineInvestment >= 50000 && otherLinesInvestment >= 25000) return 'ROJU';
        if (maxLineInvestment >= 10000 && otherLinesInvestment >= 5000) return 'BUGYO';
        if (maxLineInvestment >= 5000 && otherLinesInvestment >= 2500) return 'DAIKAN';
        return 'BUSHO';
    }

    // 足軽の判定を修正
    // total_team_investmentではなく、childrenInvestmentを使用
    const childrenInvestment = node.children?.reduce((sum: number, child: any) => 
        sum + (child.investment_amount || 0), 0) || 0;

    // 傘下の投資額のみで判定
    return childrenInvestment >= 1000 ? 'ASHIGARU' : 'NONE';
};

const calculateInvestmentLines = (node: any, profiles: any[]): { 
    maxLine: number, 
    otherLines: number 
} => {
    // 直接の紹介者を取得
    const directReferrals = profiles.filter(p => p.referrer_id === node.id);
    
    if (directReferrals.length === 0) {
        return { maxLine: 0, otherLines: 0 };
    }

    // 各ラインの投資額を計算
    const lineInvestments = directReferrals.map(referral => {
        // 直接の紹介者の投資額を計算
        const referralInvestment = referral.nft_purchase_requests
            ?.filter((nft: any) => nft.status === 'approved')
            ?.reduce((sum: number, nft: any) => 
                sum + Number(nft.nft_settings?.price || 0), 0) || 0;

        // 配下のユーザーを取得
        const referralTree = profiles.filter(p => {
            let current = p;
            while (current.referrer_id) {
                if (current.referrer_id === referral.id) return true;
                current = profiles.find(p2 => p2.id === current.referrer_id);
            }
            return false;
        });

        // 配下の投資額を計算
        const treeInvestment = referralTree.reduce((sum: number, p) => {
            const userInvestment = p.nft_purchase_requests
                ?.filter((nft: any) => nft.status === 'approved')
                ?.reduce((s: number, nft: any) => 
                    s + Number(nft.nft_settings?.price || 0), 0) || 0;
            return sum + userInvestment;
        }, 0);

        // ラインの合計投資額（直接の紹介者 + 配下）
        return referralInvestment + treeInvestment;
    });

    console.log(`Line investments for ${node.display_id}:`, lineInvestments);

    // 最大ラインと他のライン合計を計算
    const maxLine = Math.max(...lineInvestments, 0);
    const otherLines = lineInvestments.reduce((sum, inv) => sum + inv, 0) - maxLine;

    console.log(`Investment lines for ${node.display_id}:`, {
        lineInvestments,
        maxLine,
        otherLines
    });

    return { maxLine, otherLines };
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
                    .select(`
                        *,
                        nft_purchase_requests (
                            id,
                            status,
                            nft_settings (
                                id,
                                name,
                                price
                            )
                        )
                    `)

                if (profileError) throw profileError
                
                // デバッグ用にデータを出力
                console.log('User data with referrers:', profiles)

                // 組織ツリーを構築
                const organizationTree = await buildOrganizationTree(profiles)
                
                // 統計情報の計算を修正
                const stats = calculateTotalStats(organizationTree);
                setStats({
                    totalInvestment: stats.investment,
                    totalUsers: stats.users
                });

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
                // デバッグ: 現在処理中のノード
                console.log('Building tree for node:', node.display_id);

                const children = await Promise.all(
                    profiles
                        .filter(p => p.referrer_id === node.id)
                        .map(child => buildTree(child))
                )

                // NFTデータはすでにプロフィールに含まれている
                const nftData = node.nft_purchase_requests || [];
                
                // 投資額を計算（型を追加）
                const investment = nftData
                    .filter((nft: { status: string }) => nft.status === 'approved')
                    .reduce((sum: number, nft: { nft_settings: { price: number } }) => {
                        return sum + Number(nft.nft_settings?.price || 0);
                    }, 0);

                console.log(`Investment calculation for ${node.display_id}:`, {
                    nftData,
                    investment,
                    status: nftData.map((nft: NFTData) => nft.status)
                });

                // 子ノードの投資額を合算
                const childrenInvestment = children.reduce((sum, child) => 
                    sum + (child.investment_amount || 0), 0);
                
                // デバッグ: 子ノードの投資額
                console.log(`Children investment for ${node.display_id}:`, childrenInvestment);

                const totalTeamInvestment = investment + childrenInvestment;

                // デバッグ: 合計チーム投資額
                console.log(`Total team investment for ${node.display_id}:`, totalTeamInvestment);

                // 投資ラインを計算
                const { maxLine, otherLines } = calculateInvestmentLines(node, profiles);

                // レベルを非同期で取得
                const level = await calculateLevel({
                    ...node,
                    investment_amount: investment,
                    max_line_investment: maxLine,
                    other_lines_investment: otherLines,
                    total_team_investment: totalTeamInvestment,
                    children: children
                });

                console.log(`Setting level for ${node.display_id}:`, level); // デバッグ用

                return {
                    id: node.id,
                    display_id: node.display_id,
                    name: node.name || node.display_id,
                    name_kana: node.name_kana || '',
                    email: node.email || '',
                    display_name: node.display_name || '',
                    level: level,
                    investment_amount: investment,
                    max_line_investment: maxLine,
                    other_lines_investment: otherLines,
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