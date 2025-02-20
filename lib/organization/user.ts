import { supabase } from '../supabase';
import { OrganizationMember, NFTPurchaseRequest } from './types';

export const buildOrganizationTreeFromSupabase = async (userId: string) => {
    try {
        // まずユーザーのプロフィールを取得
        const { data: userProfile, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (userError || !userProfile) return null;

        // 全ての傘下を一度に取得
        const { data: profiles } = await supabase
            .from('profiles')
            .select(`
                *,
                nft_purchase_requests (
                    id,
                    status,
                    nft_settings (
                        id,
                        price
                    )
                )
            `)
            .eq('status', 'active')
            .or(`referrer_id.eq.${userProfile.id}`);

        // デバッグ
        console.log('Fetched profiles:', { userProfile, profiles });

        const buildNode = (currentUserId: string) => {
            const profile = currentUserId === userProfile.id ? userProfile : profiles?.find(p => p.id === currentUserId);
            if (!profile) return null;

            const children = profiles
                ?.filter(p => p.referrer_id === currentUserId)
                .map(buildNode)
                .filter(Boolean) || [];

            const nftInvestment = profile.nft_purchase_requests
                ?.filter(req => req.status === 'approved')
                .reduce((sum, req) => sum + Number(req.nft_settings?.price || 0), 0) || 0;

            return {
                ...profile,
                investment_amount: nftInvestment,
                children,
                max_line_investment: 0,
                other_lines_investment: 0,
                total_team_investment: children.reduce((sum, child) => 
                    sum + child.investment_amount + (child.total_team_investment || 0), 0)
            };
        };

        return buildNode(userProfile.id);

    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}; 