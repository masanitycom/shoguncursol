import { supabase } from '../lib/supabase';

async function migrateToUserLevels() {
    try {
        console.log('Starting migration...');

        // まず既存のデータをクリア
        const { error: clearError } = await supabase
            .from('user_levels')
            .delete()
            .neq('id', 'dummy');

        if (clearError) {
            console.error('Clear error:', clearError);
            return;
        }

        // インポートしたデータを取得
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            return;
        }

        console.log('Found profiles:', profiles?.length);

        // データを移行
        for (const profile of profiles || []) {
            const userData = {
                id: profile.id,
                name: profile.name,
                investment: profile.investment || 0,
                referrer: profile.referrer || null,
                created_at: profile.created_at,
                updated_at: profile.updated_at
            };

            const { error: insertError } = await supabase
                .from('user_levels')
                .insert(userData);

            if (insertError) {
                console.error(`Error inserting ${profile.id}:`, insertError);
                console.error('Data:', userData);
            } else {
                console.log(`Inserted ${profile.id}`);
            }
        }

        console.log('Migration completed');

    } catch (error) {
        console.error('Migration error:', error);
    }
}

migrateToUserLevels().catch(console.error); 