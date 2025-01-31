import { supabase } from '../lib/supabase';

interface ReferralRelation {
    id: string
    email: string
    referrer: {
        id: string
        email: string
    } | null
}

async function verifyMigration() {
    console.log('移行データの検証を開始...');

    // 1. 全体のユーザー数を確認
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

    // 2. 移行されたユーザーの詳細
    const { data: migratedUsers } = await supabase
        .from('profiles')
        .select(`
            id,
            email,
            referrer_id,
            needs_password_reset
        `)
        .eq('needs_password_reset', true);

    // 3. 紹介者関係の詳細チェック
    const { data: rawReferralRelations } = await supabase
        .from('profiles')
        .select(`
            id,
            email,
            referrer:profiles!referrer_id (
                id,
                email
            )
        `)
        .not('referrer_id', 'is', null)

    // データを適切な形に変換
    const referralRelations: ReferralRelation[] = (rawReferralRelations || []).map(r => ({
        id: r.id,
        email: r.email,
        referrer: r.referrer?.[0] || null  // 配列の最初の要素を取得
    }))

    // 4. 結果を表示
    console.log(`
検証結果:
====================
総ユーザー数: ${totalUsers}
移行済みユーザー数: ${migratedUsers?.length}
紹介者関係のある数: ${referralRelations?.length}

移行ユーザーサンプル:
${migratedUsers?.slice(0, 3).map(u => `
- ID: ${u.id}
  Email: ${u.email}
  Referrer: ${u.referrer_id || 'なし'}
`).join('\n')}

紹介者関係サンプル:
${referralRelations.slice(0, 3).map(r => `
- User: ${r.email}
  Referrer: ${r.referrer?.email || '不明'}
`).join('\n')}
====================
    `);

    // 5. 問題のあるデータをチェック
    const invalidReferrals = referralRelations?.filter(r => !r.referrer);
    if (invalidReferrals?.length) {
        console.log(`
警告: 無効な紹介者関係が見つかりました:
${invalidReferrals.map(r => `- ${r.email}`).join('\n')}
        `);
    }
}

async function verifyReferralRelations() {
    const { data: rawReferralRelations } = await supabase
        .from('users')
        .select(`
            id,
            email,
            referrer:referrer_id (
                id,
                email
            )
        `)
        .limit(3)

    // データを適切な形に変換
    const referralRelations: ReferralRelation[] = (rawReferralRelations || []).map(r => ({
        id: r.id,
        email: r.email,
        referrer: r.referrer?.[0] || null  // 配列の最初の要素を取得
    }))

    console.log(`
====================
紹介関係の確認
${referralRelations.slice(0, 3).map(r => `
- User: ${r.email}
  Referrer: ${r.referrer?.email || '不明'}
`).join('\n')}
====================
    `)
}

// スクリプトを実行
verifyMigration().catch(console.error); 