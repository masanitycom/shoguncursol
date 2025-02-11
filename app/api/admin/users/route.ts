import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { UserProfileUpdate } from '@/types/user';

export async function PUT(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { userId, updateData } = await request.json() as { 
            userId: string, 
            updateData: UserProfileUpdate 
        };

        // 管理者権限の確認
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 1. プロフィールの更新
        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('user_id', userId);

        if (profileError) throw profileError;

        // 2. ユーザー情報の更新
        const { error: userError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (userError) throw userError;

        return NextResponse.json({ 
            success: true, 
            message: 'User updated successfully' 
        });

    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
} 