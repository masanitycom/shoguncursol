import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildOrganizationTree } from '@/lib/utils/organizationUtils';
import { UserViewData } from '@/types/organization';

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const { data: userViewData, error } = await supabase
            .from('user_view')
            .select('*');

        if (error) throw error;

        // 組織構造の構築
        const organizationData = buildOrganizationTree(userViewData as UserViewData[]);

        return NextResponse.json({
            success: true,
            data: organizationData
        });

    } catch (error) {
        console.error('Error fetching organization:', error);
        return NextResponse.json(
            { 
                success: false,
                error: '組織図の取得中にエラーが発生しました'
            },
            { status: 500 }
        );
    }
} 