import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// サービスロールキーを使用したクライアントの初期化
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // 1. ユーザーの存在確認
        const { data: user, error: userCheckError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', userId)
            .single();

        if (userCheckError || !user) {
            console.error('User check error:', userCheckError);
            return NextResponse.json(
                { error: 'ユーザーが見つかりません' },
                { status: 404 }
            );
        }

        // 2. セッションを強制終了
        await supabase.auth.admin.signOut(userId);

        // 3. プロフィールの削除
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Profile deletion error:', profileError);
            return NextResponse.json(
                { error: profileError.message },
                { status: 500 }
            );
        }

        // 4. 認証ユーザーの削除
        const { error: authError } = await supabase.auth.admin
            .deleteUser(userId);

        if (authError) {
            console.error('Auth deletion error:', authError);
            // プロフィールは削除されているが、認証ユーザーの削除に失敗した場合のログ
            return NextResponse.json(
                { error: authError.message },
                { status: 500 }
            );
        }

        // 5. 不整合データのクリーンアップ
        await cleanupOrphanedData();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in delete-user API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// 不整合データのクリーンアップ
async function cleanupOrphanedData() {
    try {
        // プロフィールはあるが認証情報がないユーザーを削除
        const { data: orphanedProfiles } = await supabase
            .from('profiles')
            .select('id')
            .not('id', 'in', (
                supabase.from('auth.users').select('id')
            ));

        if (orphanedProfiles?.length) {
            await supabase
                .from('profiles')
                .delete()
                .in('id', orphanedProfiles.map(p => p.id));
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
} 