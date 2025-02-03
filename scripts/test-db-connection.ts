import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// 明示的に.envファイルのパスを指定
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('環境変数:', {
    url: supabaseUrl ? '設定済み' : '未設定',
    key: supabaseServiceRoleKey ? '設定済み' : '未設定'
  });
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: {
    schema: 'public'
  }
});

async function testConnection() {
  try {
    // ユーザー数の確認
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    console.log('データベース接続成功');
    console.log('ユーザー数:', count);

    // テーブル一覧の取得
    const { data, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      // RPCが利用できない場合は、直接テーブル一覧を取得
      const { data: tables, error: directError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (directError) throw directError;
      
      console.log('接続テスト完了 - usersテーブルにアクセス可能');
    } else {
      console.log('利用可能なテーブル:', data);
    }

  } catch (err) {
    console.error('データベース接続エラー:', err);
  }
}

testConnection();