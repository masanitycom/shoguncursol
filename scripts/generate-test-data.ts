import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });  // 明示的にパスを指定
import { TestDataGenerator } from '../lib/services/test-data-generator';
import { supabase } from '../lib/supabase';

// TestUserインターフェースをインポートまたは再定義
interface TestUser {
    id: string;
    user_id: string;
    name_kana: string;
    email: string;
    phone: string;
    display_id: string;
    investment: number;
    referrer_id?: string;
    level?: string;
}

// 環境変数の確認
console.log('Environment:', {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    HAS_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
});

async function runMaintenance() {
    try {
        const { error } = await supabase.rpc('run_maintenance');
        if (error) throw error;
        console.log('メンテナンス完了');
    } catch (error) {
        console.error('メンテナンスエラー:', error);
    }
}

async function main() {
    try {
        console.log('Supabase Config:', {
            url: process.env.SUPABASE_URL,
            hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
        });

        console.log('Initializing Supabase client');
        console.log('Environment:', {
            SUPABASE_URL: process.env.SUPABASE_URL,
            HAS_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            NODE_ENV: process.env.NODE_ENV,
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        });

        // メンテナンスモード中の処理
        console.log('メンテナンス開始...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        console.log('Initial auth state:', {
            isAuthenticated: !!authData?.session,
            user: authData?.session?.user
        });

        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', { event, user: session?.user, metadata: session?.user?.user_metadata });
        });

        console.log('メンテナンス完了');

        // テストデータ生成
        console.log('テストデータ生成開始...');
        const result = await TestDataGenerator.createTestUsers(30);

        if (!result.success || !result.users) {
            throw new Error('テストデータ生成に失敗しました');
        }

        // メールアドレスの重複チェック
        const { count: emailCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .in('email', result.users.map((u: TestUser) => u.email));

        // display_idの重複チェック
        const { count: displayIdCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .in('display_id', result.users.map((u: TestUser) => u.display_id));

        if (emailCount && emailCount > 0) {
            console.log(`重複するメールアドレス数: ${emailCount}`);
        }

        if (displayIdCount && displayIdCount > 0) {
            console.log(`重複するdisplay_id数: ${displayIdCount}`);
        }

        console.log('テストデータ生成成功:', result.users);

        // レベル分布の確認
        const { data: levelDistribution } = await supabase
            .from('users')
            .select('level, investment_amount')
            .order('investment_amount', { ascending: true });

        console.log('レベル分布:', groupBy(levelDistribution || [], 'level'));

        // バイナリツリー構造の確認
        const { data: binaryTree } = await supabase
            .from('binary_tree')
            .select('*')
            .order('created_at', { ascending: true });

        console.log('バイナリツリー構造:', binaryTree);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// ヘルパー関数
function groupBy(array: any[], key: string) {
    return array.reduce((result, currentValue) => {
        (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
        return result;
    }, {});
}

main(); 