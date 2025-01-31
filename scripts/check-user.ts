import { supabase } from '../lib/supabase';

async function checkUser(userId: string) {
    try {
        // ユーザーデータを確認
        console.log(`\nChecking user: ${userId}`);
        const { data: user, error: userError } = await supabase
            .from('user_data')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('User error:', userError);
        } else {
            console.log('User data:', user);
        }

        // 紹介者を確認
        if (user?.referrer) {
            console.log(`\nChecking referrer: ${user.referrer}`);
            const { data: referrer, error: referrerError } = await supabase
                .from('user_data')
                .select('*')
                .eq('id', user.referrer)
                .single();

            if (referrerError) {
                console.error('Referrer error:', referrerError);
            } else {
                console.log('Referrer data:', referrer);
            }
        }

        // このユーザーを紹介者とするユーザーを確認
        console.log(`\nChecking referrals for: ${userId}`);
        const { data: referrals, error: referralsError } = await supabase
            .from('user_data')
            .select('*')
            .eq('referrer', userId);

        if (referralsError) {
            console.error('Referrals error:', referralsError);
        } else {
            console.log('Referrals:', referrals);
        }

    } catch (error) {
        console.error('Check error:', error);
    }
}

// PHULIKEとKPROを確認
Promise.all([
    checkUser('PHULIKE'),
    checkUser('KPRO')
]).catch(console.error); 