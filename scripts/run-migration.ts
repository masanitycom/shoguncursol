import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
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

async function runMigration() {
  try {
    // PostgreSQLに直接接続
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // クエリを実行
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 報酬関連テーブルの作成
      const tables = [
        'daily_profits',
        'nft_daily_profits',
        'reward_requests',
        'user_rewards',
        'reward_claims'
      ];

      for (const table of tables) {
        const { rows } = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (!rows[0].exists) {
          console.log(`Creating table: ${table}`);
          const sql = fs.readFileSync(
            path.resolve(__dirname, '../migrations/002_create_reward_tables.ts'),
            'utf8'
          );
          await client.query(sql);
          break; // テーブルが1つでも存在しない場合、マイグレーションを実行
        }
      }

      await client.query('COMMIT');
      console.log('マイグレーション成功');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      await pool.end();
    }

  } catch (err) {
    console.error('マイグレーションエラー:', err);
  }
}

runMigration(); 