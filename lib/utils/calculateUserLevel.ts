import { supabase } from '@/lib/supabase';
import { UserLevelParams } from '@/types/user';

export async function fetchUserLevelInfo(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

export function calculateUserLevel(params: UserLevelParams): string {
    // ... レベル計算ロジック
    return 'level';
} 