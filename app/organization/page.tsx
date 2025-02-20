'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UserHeader from '@/components/UserHeader'
import { useAuth } from '@/lib/auth'
import { OrganizationMember } from '@/types/organization'

// 型定義の修正
interface NFTSettings {
    id: string;
    name: string;
    price: number;
}

interface NFTPurchaseRequest {
    id: string;
    status: string;
    nft_settings: NFTSettings;
}

interface Profile {
    id: string;
    display_id: string;
    name: string;
    investment_amount: number;
    max_line_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    nft_purchase_requests: NFTPurchaseRequest[];
}

// 型定義を追加
interface TeamInvestments {
    maxLineInvestment: number;
    otherInvestment: number;
}

// 型定義を修正
interface NFTData {
    id: string;
    user_id: string;
    status: string;
    nft_settings: {
        id: string;
        price: string | number;
    };
}

// PostgrestResponseの型を修正
type PostgrestResponse<T> = {
    data: T[] | null;
    error: any;
    count: number | null;
    status: number;
    statusText: string;
}

interface NFTResponse {
    data: NFTData[] | null;
    error: any;
}

// NFTデータの型を修正
interface RawNFTData {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    nft_settings: NFTSettings;  // 配列ではなく単一のオブジェクト
}

// 型エラーの修正
interface Member {
    id: string;
    display_id: string;
    name: string;
    email: string;
    display_name: string;
    level: string;  // データベースから取得したレベル
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    children: Member[];
}

// レベル要件の定義
const LEVEL_REQUIREMENTS = {
    NONE: {
        requiredNFT: 'NONE',
        totalInvestment: 0,
        profitShare: 0
    },
    ASHIGARU: {
        requiredNFT: 'SHOGUN NFT1000',
        totalInvestment: 1000,
        profitShare: 45
    },
    BUSHO: {
        requiredNFT: 'SHOGUN NFT1000',
        maxLineInvestment: 3000,
        otherLinesInvestment: 1500,
        profitShare: 25
    },
    // ... 他のレベルも同様
} as const;

// レベル名の日本語マッピング
const LEVEL_NAMES_JP = {
    'none': '--',
    'ashigaru': '足軽',
    'busho': '武将',
    'daikan': '代官',
    'bugyo': '奉行',
    'roju': '老中',
    'tairo': '大老',
    'daimyo': '大名',
    'shogun': '将軍'
} as const;

// 投資額計算用の関数を追加
const calculateTeamInvestments = (member: OrganizationMember): number => {
    // 自身の投資額
    let totalInvestment = member.investment_amount;

    // 子ノードの投資額を再帰的に計算
    if (member.children && member.children.length > 0) {
        member.children.forEach(child => {
            totalInvestment += calculateTeamInvestments(child);
        });
    }

    return totalInvestment;
};

// 再帰的に子ノードのNFTデータを取得する関数を追加
const fetchChildrenNFTs = async (profile: any): Promise<OrganizationMember> => {
    // NFTデータを取得
    const { data: nftData, error: nftError } = await supabase
        .from('nft_purchase_requests')
        .select(`
            id,
            user_id,
            status,
            nft_settings!inner (
                id,
                name,
                price
            )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'approved');

    if (nftError) throw nftError;

    // 投資額を計算
    const investment = (nftData || []).reduce((sum: number, nft: any) => {
        const price = Number(nft.nft_settings?.price || 0);
        return sum + price;
    }, 0);

    // 子ノードを取得
    const { data: childrenProfiles, error: childrenError } = await supabase
        .from('profiles')
        .select('*')
        .eq('referrer_id', profile.id);

    if (childrenError) throw childrenError;

    // 子ノードを再帰的に処理
    const children = await Promise.all(
        (childrenProfiles || []).map(child => fetchChildrenNFTs(child))
    );

    // 最大系列と他系列の投資額を計算
    let maxLineInvestment = 0;
    let otherLinesInvestment = 0;

    if (children.length > 0) {
        const lineInvestments = children.map(child => child.total_team_investment);
        maxLineInvestment = Math.max(...lineInvestments);
        otherLinesInvestment = lineInvestments.reduce((sum: number, inv: number) => 
            sum + (inv === maxLineInvestment ? 0 : inv), 0);
    }

    // 全体の投資額を計算
    const totalTeamInvestment = investment + children.reduce(
        (sum: number, child) => sum + child.total_team_investment, 0
    );

    // OrganizationMember型に変換
    const member: OrganizationMember = {
        id: profile.id,
        display_id: profile.display_id,
        name: profile.name || profile.display_id,
        investment_amount: investment,
        max_line_investment: maxLineInvestment,
        other_lines_investment: otherLinesInvestment,
        total_team_investment: totalTeamInvestment,
        referrer_id: profile.referrer_id,
        children: children,
        nft_purchase_requests: nftData.map((nft: any) => ({
            id: nft.id,
            status: nft.status,
            nft_settings: {
                id: nft.nft_settings.id,
                name: nft.nft_settings.name,
                price: nft.nft_settings.price
            }
        }))
    };

    return member;
};

// 投資額計算の修正
const calculateInvestment = (nftData: any[]): number => {
    return (nftData || []).reduce((sum: number, nft: any) => {
        const price = Number(nft.nft_settings?.price || 0);
        return sum + price;
    }, 0);
};

// 組織ツリーの取得を修正
const buildOrganizationTree = async (userId: string): Promise<OrganizationMember> => {
    try {
        // プロフィールを取得
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw profileError;
        }

        // NFTデータを取得
        const { data: nftData, error: nftError } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                status,
                nft_settings!inner (
                    id,
                    name,
                    price
                )
            `)
            .eq('user_id', profile.id)
            .eq('status', 'approved');

        console.log('NFT data for', profile.display_id, ':', {
            nfts: nftData,
            sql: `
            SELECT npr.*, ns.name, ns.price
            FROM nft_purchase_requests npr
            INNER JOIN nft_settings ns ON ns.id = npr.nft_id
            WHERE npr.user_id = '${profile.id}'
            AND npr.status = 'approved'
            `
        });

        if (nftError) {
            console.error('NFT fetch error:', nftError);
            throw nftError;
        }

        // 投資額を計算
        const actualInvestment = (nftData || []).reduce((sum: number, nft: any) => {
            return sum + Number(nft.nft_settings?.price || 0);
        }, 0);

        // プロフィールの投資額を使用（一時的な対処）
        const selfInvestment = profile.investment_amount;

        // 投資額の不一致をログ
        if (profile.investment_amount !== actualInvestment) {
            console.warn('Investment amount mismatch:', {
                user: profile.display_id,
                profile_amount: profile.investment_amount,
                nft_amount: actualInvestment,
                difference: profile.investment_amount - actualInvestment,
                nft_details: nftData
            });
        }

        // 子ノードを取得
        const { data: children, error: childrenError } = await supabase
            .from('profiles')
            .select('*')
            .eq('referrer_id', userId);

        if (childrenError) {
            console.error('Children fetch error:', childrenError);
            throw childrenError;
        }

        // 子ノードを再帰的に処理
        const childNodes = await Promise.all(
            (children || []).map(async (child) => {
                const childTree = await buildOrganizationTree(child.id);
                console.log('Child node processed:', {
                    display_id: child.display_id,
                    id: child.id,
                    investment: childTree.investment_amount,
                    total: childTree.total_team_investment
                });
                return childTree;
            })
        );

        // 最大系列と他系列の投資額を計算
        let maxLineInvestment = 0;
        let otherLinesInvestment = 0;

        if (childNodes.length > 0) {
            const lineInvestments = childNodes.map(child => {
                console.log('Line investment for', child.display_id, ':', child.total_team_investment);
                return child.total_team_investment;
            });
            
            maxLineInvestment = Math.max(...lineInvestments);
            otherLinesInvestment = lineInvestments.reduce((sum: number, investment: number) => 
                sum + (investment === maxLineInvestment ? 0 : investment), 0);
        }

        // 全体の投資額を計算
        const totalTeamInvestment = selfInvestment + childNodes.reduce(
            (sum: number, child) => sum + child.total_team_investment, 0
        );

        return {
            ...profile,
            nft_purchase_requests: nftData.map((nft: any) => ({
                id: nft.id,
                status: nft.status,
                nft_settings: {
                    id: nft.nft_settings.id,
                    name: nft.nft_settings.name,
                    price: nft.nft_settings.price
                }
            })),
            investment_amount: selfInvestment,
            max_line_investment: maxLineInvestment,
            other_lines_investment: otherLinesInvestment,
            total_team_investment: totalTeamInvestment,
            children: childNodes
        };
    } catch (error) {
        console.error('Error building organization tree:', error);
        throw error;
    }
};

const renderMemberNode = (member: OrganizationMember, level: number = 0, isRoot: boolean = true) => {
    const levelLabel = getLevelLabel(member);
    
    return (
        <div key={member.id} className="relative">
            <div className={`
                p-4 rounded-lg mb-2
                ${isRoot ? 'bg-blue-900/20' : 'bg-gray-800/50'}
                hover:bg-gray-800/80 transition-colors
            `}>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                            {isRoot ? member.name : member.display_id}
                        </span>
                        {isRoot && (
                            <span className="text-gray-400 text-sm">
                                ({member.display_id})
                            </span>
                        )}
                        <span className="px-2 py-1 bg-red-600 rounded text-xs text-white">
                            {levelLabel}
                        </span>
                    </div>
                    <div className="text-white mt-1">
                        自身の投資額: ${member.investment_amount.toLocaleString()}
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                        <div>最大系列: ${member.max_line_investment.toLocaleString()}</div>
                        <div>他系列全体: ${member.other_lines_investment.toLocaleString()}</div>
                        <div>合計投資額: ${member.total_team_investment.toLocaleString()}</div>
                    </div>
                </div>
            </div>
            {member.children && member.children.length > 0 && (
                <div className="ml-8">
                    {member.children.map(child => renderMemberNode(child, level + 1, false))}
                </div>
            )}
        </div>
    );
};

const getLevelLabel = (member: OrganizationMember): string => {
    // NFTデータのデバッグ出力
    console.log('NFT check for', member.display_id, ':', {
        nfts: member.nft_purchase_requests?.map(nft => ({
            name: nft.nft_settings.name,
            status: nft.status
        })) || []
    });

    // SHOGUN NFT1000の所持確認
    const hasShogunNFT = member.nft_purchase_requests?.some(nft =>
        nft.nft_settings.name.includes('SHOGUN NFT') && 
        nft.status === 'approved'
    ) ?? false;

    // NFT要件を満たさない場合
    if (!hasShogunNFT) {
        console.log('Level check:', {
            user: member.display_id,
            result: 'none',
            reason: 'No SHOGUN NFT',
            nfts: member.nft_purchase_requests
        });
        return LEVEL_NAMES_JP['none'];
    }

    // レベル判定（系列条件）
    const levelCheck = {
        user: member.display_id,
        max_line: member.max_line_investment,
        other_lines: member.other_lines_investment,
        has_shogun_nft: hasShogunNFT,
        nfts: member.nft_purchase_requests
    };

    if (member.max_line_investment >= 600000 && member.other_lines_investment >= 500000) {
        console.log('Level check:', { ...levelCheck, result: 'shogun' });
        return LEVEL_NAMES_JP['shogun'];
    }
    if (member.max_line_investment >= 300000 && member.other_lines_investment >= 150000) 
        return LEVEL_NAMES_JP['daimyo'];
    if (member.max_line_investment >= 100000 && member.other_lines_investment >= 50000) 
        return LEVEL_NAMES_JP['tairo'];
    if (member.max_line_investment >= 50000 && member.other_lines_investment >= 25000) 
        return LEVEL_NAMES_JP['roju'];
    if (member.max_line_investment >= 10000 && member.other_lines_investment >= 5000) 
        return LEVEL_NAMES_JP['bugyo'];
    if (member.max_line_investment >= 5000 && member.other_lines_investment >= 2500) 
        return LEVEL_NAMES_JP['daikan'];
    if (member.max_line_investment >= 3000 && member.other_lines_investment >= 1500) 
        return LEVEL_NAMES_JP['busho'];

    // 最低条件のみ満たす場合
    console.log('Level check:', { ...levelCheck, result: 'ashigaru' });
    return LEVEL_NAMES_JP['ashigaru'];
};

export default function OrganizationPage() {
    const router = useRouter()
    const { user, loading: authLoading, handleLogout } = useAuth()
    const [organizationTree, setOrganizationTree] = useState<OrganizationMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session?.user) {
                    router.push('/login')
                    return
                }

                // プロフィールをメールアドレスで検索
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', session.user.email)
                    .single();

                if (profileError) {
                    console.error('Profile lookup error:', {
                        error: profileError,
                        user: session.user,
                        email: session.user.email
                    });
                    throw profileError;
                }

                // プロフィールIDを使用して組織ツリーを取得
                const tree = await buildOrganizationTree(profile.id)
                console.log('Organization tree:', tree)
                setOrganizationTree(tree)
            } catch (error) {
                console.error('Error:', error)
                setError('組織データの取得に失敗しました')
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            checkAuth()
        }
    }, [authLoading, router])

    // ローディング中の表示
    if (authLoading || loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <UserHeader user={user} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-white mb-6">組織図</h1>
                
                {organizationTree ? (
                    <div className="bg-gray-900 p-6 rounded-lg">
                        {renderMemberNode(organizationTree)}
                    </div>
                ) : (
                    <div className="text-white">組織データがありません</div>
                )}
            </main>
        </div>
    );
}