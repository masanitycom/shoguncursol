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

async function checkRelationships() {
  try {
    const { data, error } = await supabase
      .rpc('get_foreign_keys', {
        table_name: 'nft_purchase_requests'
      });

    if (error) throw error;
    console.log('NFT Purchase Requests のリレーションシップ:', data);

  } catch (err) {
    console.error('確認エラー:', err);
  }
}

checkRelationships(); 