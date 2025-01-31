import { supabase } from '../lib/supabase';

async function checkMigration() {
    try {
        // user_levelsテーブルの存在を確認
        const { data: tableInfo, error: tableError } = await supabase
            .from('user_levels')
            .select('*')
            .limit(1);

        console.log('Table check:', { tableInfo, tableError });

        // PHULIKEのデータを確認
        const { data: phulike, error: phulikeError } = await supabase
            .from('user_levels')
            .select('*')
            .eq('id', 'PHULIKE')
            .single();

        console.log('PHULIKE check:', { phulike, phulikeError });

        // 全データ数を確認
        const { data: allData, error: countError } = await supabase
            .from('user_levels')
            .select('*');

        console.log('Total records:', allData?.length);

    } catch (error) {
        console.error('Check error:', error);
    }
}

checkMigration().catch(console.error); 