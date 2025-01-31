import { supabase } from '../lib/supabase';

async function setupTestData() {
    // 1. テストユーザーの作成（実在のユーザーIDを使用）
    const testUserId = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'; // 例：実在のユーザーID

    // 2. NFTの所有データ
    await supabase.from('user_nfts').insert([
        {
            user_id: testUserId,
            nft_id: 'nft-1000',
            purchase_date: '2024-01-01',
            status: 'active',
            price: 1000  // SHOGUN NFT1000
        }
    ]);

    // 3. 紹介者（系列）データ
    const referral1 = await supabase.from('users').insert([
        {
            email: 'referral1@test.com',
            referrer_id: testUserId
        }
    ]).select('id').single();

    const referral2 = await supabase.from('users').insert([
        {
            email: 'referral2@test.com',
            referrer_id: testUserId
        }
    ]).select('id').single();

    // 4. 系列の投資データ
    if (referral1?.data?.id) {
        await supabase.from('user_investments').insert([
            {
                user_id: referral1.data.id,
                total_amount: 3000  // 最大系列
            }
        ]);
    }

    if (referral2?.data?.id) {
        await supabase.from('user_investments').insert([
            {
                user_id: referral2.data.id,
                total_amount: 1500  // 他系列
            }
        ]);
    }

    console.log('テストデータのセットアップが完了しました');
}

// スクリプトの実行
setupTestData().catch(console.error); 