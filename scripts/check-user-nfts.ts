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

async function checkUserNfts() {
  try {
    // テーブル構造の確認
    const { data: structure, error: structureError } = await supabase
      .from('user_nfts')
      .select('*')
      .limit(1);

    if (structureError) throw structureError;
    console.log('\nuser_nftsテーブルの構造:', Object.keys(structure?.[0] || {}));

    // リレーションシップの確認
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        user_id,
        user_nfts (
          id,
          nft_id
        )
      `)
      .limit(3);

    if (usersError) throw usersError;
    console.log('\nユーザーとNFTの関連:', users);

  } catch (err) {
    console.error('確認エラー:', err);
  }
}

checkUserNfts(); 