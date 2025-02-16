import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// service_roleを使用してクライアントを作成
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const { email, password, display_id, name, referrer_id } = await request.json();
        console.log('Received signup request for:', { email, display_id, name, referrer_id });

        // 1. ユニークなメールアドレスを生成（ドメイン部分を保持）
        const [localPart, domain] = email.split('@');
        const uniqueEmail = `${localPart}_${Date.now()}@${domain}`;

        // 2. referrer_idの確認と変換
        let validReferrerId = null;
        let referrerUserId = null;
        let referrerData = null;

        if (referrer_id) {
            const { data: referrer, error: referrerError } = await supabase
                .from('profiles')
                .select('id, user_id, display_id, name')
                .eq('display_id', referrer_id)
                .single();
            
            if (referrerError) {
                console.error('Referrer lookup error:', referrerError);
            }
            
            if (referrer) {
                validReferrerId = referrer.id;
                referrerUserId = referrer.user_id;
                referrerData = referrer;
                console.log('Found referrer:', referrer);
            } else {
                console.warn('Referrer not found:', referrer_id);
            }
        }

        // 3. auth.usersにユーザーを作成
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: uniqueEmail,
            password,
            email_confirm: true,
            user_metadata: {
                display_id,
                name,
                real_email: email
            }
        });

        console.log('Auth creation result:', { authData, authError });

        if (authError) {
            console.error('Auth creation error:', authError);
            return NextResponse.json({ 
                error: authError.message,
                details: 'ユーザー認証の作成に失敗しました'
            }, { status: 400 });
        }

        if (!authData?.user?.id) {
            return NextResponse.json({ 
                error: 'User ID not found',
                details: 'ユーザーIDの取得に失敗しました'
            }, { status: 400 });
        }

        // 4. プロフィールを作成
        const profileData = {
            id: crypto.randomUUID(),
            user_id: authData.user.id,
            display_id,
            name,
            email,
            referrer_id: referrerUserId,
            referrer: referrer_id,
            referrer_display_id: referrerData?.display_id || null,
            referrer_name: referrerData?.name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'active',
            active: true,
            role: 'user'
        };

        // デバッグ用のログ
        console.log('Creating profile with data:', {
            ...profileData,
            referrer_details: {
                input_referrer_id: referrer_id,
                found_user_id: referrerUserId,
                found_profile_id: validReferrerId,
                referrer_display_id: referrerData?.display_id,
                referrer_name: referrerData?.name
            }
        });

        const { error: profileError } = await supabase
            .from('profiles')
            .insert(profileData);

        if (profileError) {
            console.error('Profile creation error:', profileError);
            console.log('Profile data:', profileData);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json({ 
                error: profileError.message,
                details: 'プロフィールの作成に失敗しました'
            }, { status: 400 });
        }

        // 5. 紹介関係の確認
        const { data: checkData, error: checkError } = await supabase
            .from('profiles')
            .select(`
                id,
                user_id,
                display_id,
                name,
                referrer_id,
                referrer,
                referrer_display_id,
                referrer_name,
                profiles!referrer_id (
                    id,
                    display_id,
                    name
                )
            `)
            .eq('display_id', display_id)
            .single();

        if (checkError) {
            console.error('Profile check error:', checkError);
        } else {
            console.log('Created profile with relationships:', checkData);
        }

        // 6. 登録完了を確認
        return NextResponse.json({ 
            success: true,
            message: 'ユーザー登録が完了しました',
            user: {
                id: checkData?.id,
                display_id,
                name,
                email,
                referrer_id: referrerUserId,
                referrer: referrer_id
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'ユーザー登録処理中にエラーが発生しました'
        }, { status: 500 });
    }
} 