import { supabase } from './supabase';
import { OrganizationMember } from '@/types/organization';

export const buildOrganizationTree = async (userId: string) => {
    try {
        // プロフィールとNFT購入データを一括取得
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                name,
                email,
                investment_amount,
                total_team_investment,
                max_line_investment,
                other_lines_investment,
                referrer_id,
                nft_purchase_requests (
                    id,
                    status,
                    nft_master (
                        price
                    )
                )
            `);

        if (profileError) {
            console.error('データ取得エラー:', profileError);
            throw new Error('プロフィールの取得に失敗しました');
        }

        const buildTree = async (currentUserId: string): Promise<OrganizationMember> => {
            const profile = profiles.find(p => p.id === currentUserId);
            if (!profile) throw new Error(`プロフィールが見つかりません: ${currentUserId}`);

            // 自身のNFT投資額を計算
            const selfInvestment = profile.investment_amount || 0;

            // 子ノードを取得
            const children = profiles.filter(p => p.referrer_id === currentUserId);
            const childNodes = await Promise.all(
                children.map(child => buildTree(child.id))
            );

            // 傘下全体の投資額を計算
            const totalInvestment = selfInvestment + 
                childNodes.reduce((sum, child) => sum + child.total_investment, 0);

            // 最大系列と他系列の投資額を計算
            const lineInvestments = childNodes.map(child => child.total_investment);
            const maxLineInvestment = lineInvestments.length > 0 ? Math.max(...lineInvestments) : 0;
            const otherLinesInvestment = lineInvestments
                .filter(inv => inv !== maxLineInvestment)
                .reduce((sum, inv) => sum + inv, 0);

            return {
                id: profile.id,
                display_id: profile.display_id,
                name: profile.name,
                email: profile.email,
                investment_amount: selfInvestment,
                max_line_investment: maxLineInvestment,
                other_lines_investment: otherLinesInvestment,
                total_investment: totalInvestment,
                nft_purchase_requests: profile.nft_purchase_requests || [],
                children: childNodes
            };
        };

        return await buildTree(userId);

    } catch (error) {
        console.error('組織ツリー構築エラー:', error);
        throw error;
    }
};

// 投資額計算関数を修正
const calculateInvestments = (member: OrganizationMember) => {
    let maxLineInvestment = 0;
    let otherLinesInvestment = 0;

    if (member.children.length > 0) {
        // 各ラインの投資額を計算（傘下全体を含む）
        const lineInvestments = member.children.map(child => child.total_investment);
        
        // 最大系列を特定
        maxLineInvestment = Math.max(...lineInvestments);
        
        // 他系列の合計を計算
        otherLinesInvestment = lineInvestments
            .filter(inv => inv !== maxLineInvestment)
            .reduce((sum, inv) => sum + inv, 0);
    }

    return { maxLineInvestment, otherLinesInvestment };
}; 