import { supabase } from '../lib/supabase';

async function checkProfiles() {
    try {
        console.log('Checking user_data table...');

        // user_dataテーブルのデータを確認
        const { data: users, error: userError } = await supabase
            .from('user_data')
            .select('*');

        if (userError) {
            console.error('User data error:', userError);
            return;
        }

        console.log('Users count:', users?.length);
        
        if (users && users.length > 0) {
            console.log('First user:', users[0]);
            // カラム名を表示
            console.log('\nColumns:', Object.keys(users[0]));
        } else {
            console.log('No users found');
        }

        // PHULIKEのデータを確認
        const { data: phulike, error: phulikeError } = await supabase
            .from('user_data')
            .select('*')
            .eq('id', 'PHULIKE')
            .single();

        if (phulikeError) {
            console.log('\nPHULIKE not found:', phulikeError.message);
        } else {
            console.log('\nPHULIKE data:', phulike);
        }

    } catch (error) {
        console.error('Check error:', error);
    }
}

checkProfiles().catch(console.error); 