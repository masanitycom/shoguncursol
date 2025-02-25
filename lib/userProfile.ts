import { supabase } from '@/lib/supabase'

export const getUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            id,
            user_id,
            name,
            display_id,
            referrer_id,
            investment_amount,
            max_line_investment,
            other_lines_investment,
            level,
            nft_purchase_requests!inner (
                id,
                status,
                nft_master!inner (
                    id,
                    name,
                    price
                )
            )
        `)
        .eq('user_id', userId)
        .single()

    if (error) throw error

    // チーム全体の投資額を計算
    const { data: teamMembers } = await supabase
        .from('profiles')
        .select('investment_amount')
        .eq('referrer_id', profile.id)

    const teamTotalInvestment = (teamMembers || [])
        .reduce((total, member) => total + (member.investment_amount || 0), 0)

    console.log('チーム投資額計算:', {
        user: profile.display_id,
        teamMembers: teamMembers?.length,
        teamTotal: teamTotalInvestment
    });

    return {
        ...profile,
        total_team_investment: teamTotalInvestment
    }
} 