import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function executeSql() {
  try {
    // SQLファイルを読み込む
    const sql = fs.readFileSync(
      path.resolve(__dirname, '../migrations/002_create_reward_tables.sql'),
      'utf8'
    );

    // SQLを個別のステートメントに分割
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // 各ステートメントを順番に実行
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_command: statement });
      if (error) {
        console.error('ステートメントの実行エラー:', statement);
        throw error;
      }
    }

    console.log('SQLの実行が成功しました');
  } catch (err) {
    console.error('SQLの実行エラー:', err);
  }
}

executeSql(); 