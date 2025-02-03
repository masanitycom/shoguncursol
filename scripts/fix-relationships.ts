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

async function fixRelationships() {
  try {
    // ユーザー関連の外部キー制約を整理
    const { error: userError } = await supabase.rpc('exec_sql', {
      sql_command: `
        -- 重複したユーザー制約を削除
        ALTER TABLE nft_purchase_requests 
        DROP CONSTRAINT IF EXISTS nft_purchase_requests_user_id_fkey;

        -- fk_userが存在しない場合は作成
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_user' 
            AND table_name = 'nft_purchase_requests'
          ) THEN
            ALTER TABLE nft_purchase_requests
            ADD CONSTRAINT fk_user
            FOREIGN KEY (user_id)
            REFERENCES users(id);
          END IF;
        END $$;
      `
    });

    if (userError) throw userError;

    // NFT関連の外部キー制約を整理
    const { error: nftError } = await supabase.rpc('exec_sql', {
      sql_command: `
        -- 重複したNFT制約を削除
        ALTER TABLE nft_purchase_requests 
        DROP CONSTRAINT IF EXISTS fk_nft_setting,
        DROP CONSTRAINT IF EXISTS fk_nft_settings;

        -- 新しい制約を追加
        ALTER TABLE nft_purchase_requests
        ADD CONSTRAINT fk_nft_settings
        FOREIGN KEY (nft_id)
        REFERENCES nft_settings(id);
      `
    });

    if (nftError) throw nftError;

    console.log('リレーションシップの修正が完了しました');

    // 現在の外部キー制約を確認
    const { data: constraints, error: checkError } = await supabase.rpc('exec_sql', {
      sql_command: `
        SELECT
          tc.table_name, 
          kcu.column_name,
          tc.constraint_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'nft_purchase_requests'
          AND tc.constraint_type = 'FOREIGN KEY';
      `
    });

    if (checkError) throw checkError;
    console.log('現在の外部キー制約:', JSON.stringify(constraints, null, 2));

  } catch (err) {
    console.error('Error fixing relationships:', err);
  }
}

fixRelationships(); 