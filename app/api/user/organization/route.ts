import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        // ユーザー認証チェック
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ユーザーの組織データを取得
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                user_id,
                display_id,
                name,
                email,
                investment_amount,
                total_team_investment,
                referrer_id,
                active,
                created_at
            `)
            .eq('active', true)
            .or(`user_id.eq.${user.id},referrer_id.eq.${user.id}`);

        if (error) throw error;

        // ユーザービュー用にデータを加工
        const userViewData = profiles.map(profile => ({
            ...profile,
            // 本人以外の名前を隠す
            name: profile.user_id === user.id ? profile.name : undefined,
            display_id: profile.display_id,
            investment_amount: profile.investment_amount,
            total_team_investment: profile.total_team_investment
        }));

        // 組織構造の構築
        const organizationData = buildOrganizationTree(userViewData);

        return NextResponse.json({ 
            success: true, 
            data: organizationData 
        });

    } catch (error) {
        console.error('Organization error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organization data' },
            { status: 500 }
        );
    }
} 