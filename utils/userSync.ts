import { supabase } from '@/lib/supabase';
import { UserUpdatePayload } from '@/types/user';

export const updateUserData = async (userId: string, updateData: UserUpdatePayload) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('認証エラー');

    try {
        console.log('Updating user data:', { userId, updateData });

        // まず既存のプロフィールを確認
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        console.log('Existing profile:', existingProfile);

        // profilesテーブルの更新
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: existingProfile?.id || userId, // 既存のIDを使用するか、新規の場合はuserIdを使用
                user_id: userId,
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .select();

        if (profileError) {
            console.error('Profile update error:', profileError);
            throw profileError;
        }

        // usersテーブルの更新（必要な場合）
        if (updateData.name) {
            const { error: userError } = await supabase
                .from('users')
                .update({ name: updateData.name })
                .eq('id', userId);

            if (userError) {
                console.error('User update error:', userError);
                throw userError;
            }
        }

        console.log('Profile updated:', profileData);
        return { success: true, data: profileData };
    } catch (error) {
        console.error('User update error:', error);
        throw error;
    }
}; 