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
        const supabase = createRouteHandlerClient({ cookies });
        const userData: NewUserData = await request.json();
        
        // 受信データの完全なログ
        console.log('API received data:', {
            ...userData,
            hasPassword: !!userData.password,
            passwordLength: userData.password?.length,
            email: userData.email,
            name: userData.name,
            display_id: userData.display_id
        });

        // Supabaseクライアントの設定確認
        console.log('Supabase client config:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
        });

        // メールアドレスの基本的なバリデーション
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(userData.email)) {
            return NextResponse.json(
                { error: '有効なメールアドレスを入力してください' },
                { status: 400 }
            );
        }

        // 1. 紹介者IDの確認を修正
        const { data: referrer } = await supabase
            .from('profiles')
            .select('user_id')  // idではなくuser_idを取得
            .eq('display_id', userData.referrer_id)
            .single();

        if (!referrer) {
            return NextResponse.json(
                { error: '指定された紹介者IDが見つかりません' },
                { status: 400 }
            );
        }

        // 2. display_idの重複チェック
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('display_id', userData.display_id)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'このユーザーIDは既に使用されています' },
                { status: 400 }
            );
        }

        // 既存のユーザーチェックを追加
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: existingAuthUser } = await adminSupabase
            .from('auth.users')
            .select('id')
            .eq('email', userData.email)
            .single();

        if (existingAuthUser) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 400 }
            );
        }

        // 3. 認証ユーザーの作成
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            app_metadata: {
                provider: "email",
                providers: ["email"]
            },
            user_metadata: {
                name: userData.name,
                display_id: userData.display_id,
                phone: userData.phone,
                wallet_address: userData.wallet_address,
                wallet_type: userData.wallet_type,
                referrer_id: userData.referrer_id,
                email_verified: true
            }
        });

        if (authError) {
            console.error('Auth error full details:', {
                error: authError,
                message: authError.message,
                status: authError.status,
                name: authError.name,
                email: userData.email,
                domain: userData.email.split('@')[1]
            });
            throw new Error(`認証エラー: ${authError.message}`);
        }

        // ユーザー作成成功後にメタデータを更新
        if (authData.user) {
            const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
                authData.user.id,
                {
                    app_metadata: {
                        provider: "email",
                        providers: ["email"]
                    },
                    user_metadata: {
                        name: userData.name,
                        display_id: userData.display_id,
                        email_verified: true
                    }
                }
            );

            if (updateError) {
                console.error('Update error:', updateError);
                throw new Error(`メタデータ更新エラー: ${updateError.message}`);
            }
        }

        // 4. プロフィールの作成
        if (authData.user) {
            try {
                // 既存のプロフィールを確実に削除
                await adminSupabase
                    .from('profiles')
                    .delete()
                    .eq('user_id', authData.user.id);

                // 新規プロフィールの作成
                const profileData = {
                    id: authData.user.id,
                    user_id: authData.user.id,
                    email: userData.email,
                    name: userData.name,
                    display_id: userData.display_id,
                    phone: userData.phone || null,
                    referrer_id: referrer.user_id,
                    referrer: userData.referrer_id,
                    wallet_address: userData.wallet_address || null,
                    wallet_type: userData.wallet_type || null,
                    role: 'user',
                    active: true,
                    status: 'active',
                    investment_amount: 0,
                    total_team_investment: 0,
                    max_line_investment: 0,
                    other_lines_investment: 0,
                    level: 'NONE'
                };

                // デバッグログを追加
                console.log('Creating profile with data:', {
                    userData,
                    authData: authData.user,
                    profileData
                });

                const { error: insertError } = await adminSupabase
                    .from('profiles')
                    .insert(profileData);

                if (insertError) {
                    console.error('Profile creation error:', insertError);
                    // プロフィール作成に失敗した場合、認証ユーザーも削除
                    await adminSupabase.auth.admin.deleteUser(authData.user.id);
                    throw insertError;
                }

                return NextResponse.json({ success: true });

            } catch (error: any) {
                // エラーの種類に応じて適切なメッセージを返す
                if (error.code === '23505') {
                    // 重複エラーの場合、認証ユーザーも削除
                    await adminSupabase.auth.admin.deleteUser(authData.user.id);
                    return NextResponse.json(
                        { error: 'このユーザーIDは既に使用されています' },
                        { status: 400 }
                    );
                }
                throw error;
            }
        }
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}