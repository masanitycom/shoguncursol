import { supabase } from '@/lib/supabase';
import { UserUpdatePayload } from '@/types/user';

export async function syncUserData(userId: string, updateData?: UserUpdatePayload) {
    try {
        if (updateData) {
            const { data, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error syncing user data:', error);
        throw error;
    }
} 