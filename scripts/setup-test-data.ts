import { supabase } from '../lib/supabase';

async function setupTestData() {
    try {
        // テーブルをクリーンアップ
        const { error: deleteError } = await supabase
            .from('user_levels')
            .delete()
            .neq('id', 'dummy');

        if (deleteError) {
            console.error('Cleanup error:', deleteError);
            return;
        }

        // 実際のユーザーデータを使用
        const testUsers = [
            {
                id: 'KPRO',  // 実際のユーザーID
                name: 'KPRO',
                investment: 1000,
                referrer: null
            },
            {
                id: 'PHULIKE',
                name: 'PHULIKE',
                investment: 3000,
                referrer: 'KPRO'
            },
            {
                id: 'TEST003',
                name: 'テストユーザー3',
                investment: 1500,
                referrer: 'KPRO'
            }
        ];

        // ユーザーを順番に登録
        for (const user of testUsers) {
            const { data, error } = await supabase
                .from('user_levels')
                .insert(user)
                .select()
                .single();

            if (error) {
                console.error(`Error creating user ${user.id}:`, error);
            } else {
                console.log(`User created:`, data);
            }

            // 少し待機して順序を保証
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // データを確認
        const { data: finalData, error: checkError } = await supabase
            .from('user_levels')
            .select('*')
            .order('created_at', { ascending: true });

        if (checkError) {
            console.error('Data check error:', checkError);
        } else {
            console.log('Final data in table:', finalData);
        }

        console.log('テストデータのセットアップが完了しました');
    } catch (error) {
        console.error('セットアップエラー:', error);
    }
}

setupTestData().catch(console.error); 