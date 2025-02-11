import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
        const { email, password, metadata } = await req.json();

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata
        });

        if (error) throw error;

        // ユーザー作成後、初期データを設定
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user.id,
                email: data.user.email,
                level: 'ASHIGARU',
                investment_amount: 0,
                referrer_id: metadata?.referrer_id || null,
                username: metadata?.username || null,
                wallet: null
            });

        if (insertError) throw insertError;

        return NextResponse.json({
            message: 'User created successfully',
            user: data.user
        });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 400 }
        );
    }
} 