import { supabase } from '../lib/supabase';

async function checkData() {
    try {
        // profilesテーブルのデータを確認
        console.log('Checking profiles table...');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');

        if (profileError) {
            console.error('Profiles fetch error:', profileError);
        } else {
            console.log('Profiles count:', profiles?.length);
            console.log('Sample profile:', profiles?.[0]);
        }

        // PHULIKEのデータを確認
        console.log('\nChecking PHULIKE data...');
        const { data: phulike, error: phulikeError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', 'PHULIKE')
            .single();

        if (phulikeError) {
            console.error('PHULIKE profile error:', phulikeError);
        } else {
            console.log('PHULIKE data:', phulike);
        }

        // user_levelsテーブルのデータを確認
        console.log('\nChecking user_levels table...');
        const { data: levels, error: levelError } = await supabase
            .from('user_levels')
            .select('*');

        if (levelError) {
            console.error('User levels fetch error:', levelError);
        } else {
            console.log('User levels count:', levels?.length);
            console.log('Sample level:', levels?.[0]);
        }

    } catch (error) {
        console.error('Check error:', error);
    }
}

checkData().catch(console.error); 