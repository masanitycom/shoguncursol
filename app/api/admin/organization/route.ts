import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // 管理者権限の確認
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 組織構造の取得
        const { data: organizationData, error } = await supabase
            .from('users')
            .select(`
                id,
                name,
                name_kana,
                email,
                referrer_id,
                investment_amount,
                created_at,
                active
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ 
            success: true, 
            data: organizationData 
        });

    } catch (error) {
        console.error('Organization fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organization data' },
            { status: 500 }
        );
    }
} 