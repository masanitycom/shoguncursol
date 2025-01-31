import { supabase } from '../lib/supabase';

async function insertTestData() {
    try {
        // 既存のデータをクリア
        await supabase.from('user_data').delete().neq('id', 'dummy');

        const testData = [
            // ケース1: 奉行レベル（PHULIKE）
            {
                id: 'PHULIKE',
                name: 'PHULIKE',
                investment: 1000,
                referrer: null
            },
            {
                id: 'P_USER1',
                name: 'PHULIKEの紹介1',
                investment: 30000,  // 最大系列
                referrer: 'PHULIKE'
            },
            {
                id: 'P_USER2',
                name: 'PHULIKEの紹介2',
                investment: 20000,  // 他系列
                referrer: 'PHULIKE'
            },
            {
                id: 'P_USER3',
                name: 'PHULIKEの紹介3',
                investment: 15000,  // 他系列
                referrer: 'PHULIKE'
            },

            // ケース2: 老中レベル（TANAKA）
            {
                id: 'TANAKA',
                name: 'TANAKA',
                investment: 1000,
                referrer: null
            },
            {
                id: 'T_USER1',
                name: 'TANAKAの紹介1',
                investment: 60000,  // 最大系列
                referrer: 'TANAKA'
            },
            {
                id: 'T_USER2',
                name: 'TANAKAの紹介2',
                investment: 30000,  // 他系列
                referrer: 'TANAKA'
            },

            // ケース3: 武将レベル（YAMADA）
            {
                id: 'YAMADA',
                name: 'YAMADA',
                investment: 1000,
                referrer: null
            },
            {
                id: 'Y_USER1',
                name: 'YAMADAの紹介1',
                investment: 4000,  // 最大系列
                referrer: 'YAMADA'
            },
            {
                id: 'Y_USER2',
                name: 'YAMADAの紹介2',
                investment: 2000,  // 他系列
                referrer: 'YAMADA'
            },

            // ケース4: 足軽レベル（SUZUKI）
            {
                id: 'SUZUKI',
                name: 'SUZUKI',
                investment: 1000,
                referrer: null
            },
            {
                id: 'S_USER1',
                name: 'SUZUKIの紹介1',
                investment: 1500,  // 最大系列
                referrer: 'SUZUKI'
            },

            // ケース5: レベルなし（SATO）
            {
                id: 'SATO',
                name: 'SATO',
                investment: 1000,
                referrer: null
            },
            {
                id: 'SA_USER1',
                name: 'SATOの紹介1',
                investment: 500,  // 要件未達
                referrer: 'SATO'
            }
        ];

        // データを挿入
        for (const user of testData) {
            const { error } = await supabase
                .from('user_data')
                .insert(user);

            if (error) {
                console.error(`Error inserting ${user.id}:`, error);
            } else {
                console.log(`Inserted ${user.id}`);
            }
        }

        console.log('Test data insertion completed');

    } catch (error) {
        console.error('Insertion error:', error);
    }
}

insertTestData().catch(console.error); 