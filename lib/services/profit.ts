import { supabase } from '@/lib/supabase';
import { WeeklyProfitSettings, WeeklyProfitRecord, DistributionResult } from '@/types/profit';
import { CONQUEST_BONUS_RATES } from '@/types/reward';

export async function getWeeklyProfits() {
    const { data, error } = await supabase
        .from('weekly_profits')
        .select('*')
        .order('week_start', { ascending: false });

    if (error) throw error;
    return data as WeeklyProfitRecord[];
}

export async function deleteWeeklyProfit(id: string) {
    try {
        // 1. 関連する天下統一ボーナスを削除
        const { error: bonusError } = await supabase
            .from('conquest_bonuses')
            .delete()
            .eq('weekly_profit_id', id);

        if (bonusError) throw bonusError;

        // 2. 週次利益を削除
        const { error: profitError } = await supabase
            .from('weekly_profits')
            .delete()
            .eq('id', id);

        if (profitError) throw profitError;

        return { success: true };
    } catch (error) {
        console.error('Error deleting weekly profit:', error);
        return { success: false, error };
    }
}

export async function updateWeeklyProfit(
    id: string, 
    data: Partial<WeeklyProfitSettings>
) {
    try {
        // 1. 週次利益を更新
        const { data: updatedProfit, error: updateError } = await supabase
            .from('weekly_profits')
            .update({
                week_start: data.weekStart,
                week_end: data.weekEnd,
                total_profit: data.totalProfit,
                share_rate: data.shareRate,
                distribution_amount: data.totalProfit * (data.shareRate! / 100)
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. 天下統一ボーナスを再計算
        // TODO: 実装予定
        // ボーナスの再計算は慎重に行う必要があるため、
        // 一旦この機能は保留とし、必要に応じて実装

        return { success: true, data: updatedProfit };
    } catch (error) {
        console.error('Error updating weekly profit:', error);
        return { success: false, error };
    }
}

export async function calculateAndDistributeBonus(
    weeklyProfitId: string,
    totalProfit: number,
    shareRate: number
): Promise<DistributionResult> {
    try {
        const distributionPool = totalProfit * (shareRate / 100);

        // プロフィールを取得
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, level')
            .not('level', 'eq', 'NONE');

        if (profileError) throw profileError;

        // ボーナスを計算して登録
        const bonusPromises = profiles.map(async (profile) => {
            const rate = CONQUEST_BONUS_RATES[profile.level as keyof typeof CONQUEST_BONUS_RATES];
            const amount = distributionPool * (rate / 100);

            return supabase
                .from('conquest_bonuses')
                .insert({
                    weekly_profit_id: weeklyProfitId,
                    user_id: profile.id,
                    rank: profile.level,
                    amount: amount
                });
        });

        await Promise.all(bonusPromises);

        return { success: true };
    } catch (error) {
        console.error('Error calculating conquest bonus:', error);
        return { success: false, error };
    }
} 