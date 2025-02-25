import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NewUserData } from '@/types/user';
import { createClient, AuthError } from '@supabase/supabase-js';

/**
 * サインアップAPI
 * 
 * 重要な要件：
 * - 同じメールアドレスでの複数登録を許可する
 * - display_idの重複は禁止
 * - 紹介者IDは必須で、存在確認が必要
 */
export async function POST(request: Request) {
    try {
        const requestUrl = new URL(request.url);
        const formData = await request.json();
        const { email, password, display_id, referral_code } = formData;

        const supabase = createRouteHandlerClient({ cookies });

        // メールアドレスとパスワードでサインアップ
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${requestUrl.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            console.error('Signup error:', signUpError);
            return NextResponse.json(
                { error: 'サインアップに失敗しました' },
                { status: 400 }
            );
        }

        // プロフィール情報を保存
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user!.id,
                    display_id,
                    referral_code,
                    max_line_investment: 0,
                    other_lines_investment: 0,
                    total_investment: 0
                }
            ]);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            return NextResponse.json(
                { error: 'プロフィールの作成に失敗しました' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'サインアップが完了しました' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'サインアップ処理中にエラーが発生しました' },
            { status: 500 }
        );
    }
}