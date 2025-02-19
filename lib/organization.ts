import { supabase } from './supabase';
import { OrganizationMember } from '@/types/organization';

export const buildOrganizationTree = async (userId: string): Promise<OrganizationMember> => {
    try {
        // プロフィールを取得
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) throw profileError;

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

        if (nftError) throw nftError;

        // 子ノードを取得
        const { data: children, error: childrenError } = await supabase
            .from('profiles')
            .select('*')
            .eq('referrer_id', userId);

        if (childrenError) throw childrenError;

        // 子ノードを再帰的に処理
        const childNodes = await Promise.all(
            (children || []).map(child => buildOrganizationTree(child.id))
        );

        // 最大系列と他系列の投資額を計算
        let maxLineInvestment = 0;
        let otherLinesInvestment = 0;

        if (childNodes.length > 0) {
            const lineInvestments = childNodes.map(child => child.total_team_investment);
            maxLineInvestment = Math.max(...lineInvestments);
            otherLinesInvestment = lineInvestments.reduce((sum, inv) => 
                sum + (inv === maxLineInvestment ? 0 : inv), 0);
        }

        // 全体の投資額を計算
        const totalTeamInvestment = profile.investment_amount + 
            childNodes.reduce((sum, child) => sum + child.total_team_investment, 0);

        return {
            ...profile,
            nft_purchase_requests: nftData,
            investment_amount: profile.investment_amount,
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