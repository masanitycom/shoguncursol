import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkNftRelationships() {
  try {
    // 外部キー制約の確認（修正版）
    const { data: constraints, error: constraintsError } = await supabase
      .from('nft_purchase_requests')
      .select(`
        id,
        nft_id,
        nft_settings!inner (
          id,
          name
        )
      `)
      .limit(1);

    if (constraintsError) throw constraintsError;
    console.log('\n外部キー制約の確認:', constraints ? '成功' : '失敗');

    // テーブル間の関連の確認
    const { data: relationships, error: relError } = await supabase
      .from('nft_settings')
      .select(`
        id,
        name,
        nft_purchase_requests (
          id,
          status
        )
      `)
      .limit(3);

    if (relError) throw relError;
    console.log('\nテーブル間の関連:', relationships);

    // 既存のデータ確認は正常
    const { data: purchases, error: purchasesError } = await supabase
      .from('nft_purchase_requests')
      .select(`
        id,
        nft_id,
        nft_settings:nft_id (
          id,
          name
        )
      `)
      .limit(5);

    if (purchasesError) throw purchasesError;
    console.log('\nNFT購入リクエストのサンプル:', purchases);

    console.log('\n確認が完了しました');
  } catch (err) {
    console.error('確認エラー:', err);
  }
}

checkNftRelationships(); 