import { supabase } from '../supabase';
import { OrganizationMember } from './types';

export const buildOrganizationTree = async () => {
    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                *,
                nft_purchase_requests (
                    id,
                    status,
                    nft_id,
                    nft_master!nft_id (
                        id,
                        name,
                        price
                    )
                )
            `)
            .eq('status', 'active');

        if (!profiles || error) {
            console.error('Error fetching profiles:', error);
            return null;
        }

        // ルートユーザー（referrer_idがnull）を見つける
        const rootUsers = profiles.filter(p => !p.referrer_id);

        // 組織ツリーを構築
        const buildTree = (user: any): OrganizationMember => {
            const children = profiles.filter(p => p.referrer_id === user.id);
            
            return {
                id: user.id,
                display_id: user.display_id || '',
                name: user.name || '',
                email: user.email || '',
                investment_amount: user.investment_amount || 0,
                max_line_investment: user.max_line_investment || 0,
                other_lines_investment: user.other_lines_investment || 0,
                total_team_investment: user.total_team_investment || 0,
                referrer_id: user.referrer_id,
                nft_purchase_requests: user.nft_purchase_requests || [],
                children: children.map(buildTree)
            };
        };

        return rootUsers.map(buildTree);

    } catch (error) {
        console.error('Error building organization tree:', error);
        return null;
    }
}; 