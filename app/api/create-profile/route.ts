import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { user_id, ...profileData } = await request.json();

        // セッションの確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            return NextResponse.json({ error: 'Session error' }, { status: 401 });
        }

        if (!session) {
            return NextResponse.json({ error: 'No session' }, { status: 401 });
        }

        // プロフィールの作成
        const { data, error } = await supabase
            .from('profiles')
            .insert([
                { 
                    user_id: session.user.id,  // セッションからユーザーIDを使用
                    ...profileData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Profile creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Profile creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
        );
    }
} 