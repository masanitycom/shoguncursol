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

interface TableInfo {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
  recordCount: number;
}

interface Column {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string | null;
}

interface ForeignKey {
  columnName: string;
  foreignTable: string;
  foreignColumn: string;
}

async function checkDatabaseStructure() {
  try {
    console.log('\n=== データベース構造の確認 ===\n');

    // 重要なテーブルを確認
    const targetTables = [
      'nft_settings',
      'nft_images',
      'user_nfts',
      'nft_purchase_requests',
      'users',
      'profiles',
      'user_levels'
    ];

    for (const tableName of targetTables) {
      console.log(`\n=== ${tableName} テーブル ===`);

      // テーブルの存在確認
      const { data: existsData, error: existsError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (existsError) {
        console.log(`${tableName}テーブルは存在しないか、アクセスできません`);
        continue;
      }

      // カラム情報を取得
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.error(`${tableName}のデータ取得エラー:`, sampleError);
        continue;
      }

      if (sample && sample[0]) {
        console.log('\nカラム:');
        Object.keys(sample[0]).forEach(columnName => {
          const value = sample[0][columnName];
          console.log(`  - ${columnName}`);
          console.log(`    型: ${typeof value}`);
          console.log(`    サンプル値: ${value}`);
        });
      }

      // レコード数を取得
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log('\nレコード数:', count);
      }

      // 特定のテーブルの追加チェック
      if (tableName === 'nft_settings') {
        console.log('\nimage_dataカラムの確認:');
        const { data: imageData, error: imageError } = await supabase
          .from('nft_settings')
          .select('image_data')
          .limit(1);

        if (imageError) {
          console.log('image_dataカラムは存在しません');
        } else {
          console.log('image_dataカラムは存在します');
          if (imageData && imageData[0]) {
            console.log('サンプルデータ:', imageData[0].image_data ? '存在します' : 'NULL');
          }
        }
      }
    }

  } catch (err) {
    console.error('データベース構造の確認エラー:', err);
  }
}

checkDatabaseStructure(); 