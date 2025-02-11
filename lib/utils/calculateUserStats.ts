import { SupabaseClient } from '@supabase/supabase-js';

// 紹介者の型を定義
interface Referral {
    id: string;
    investment_amount: number;
    // 他の必要なプロパティがあれば追加
}

// 系列の投資額情報の型を定義
interface LineInvestment {
    id: string;
    investment: number;
    subLines: number;
}

// 戻り値の型を定義
interface UserStats {
    maxLine: number;
    otherLines: number;
    totalInvestment: number;
}

export async function calculateUserStats(
    userId: string, 
    supabase: SupabaseClient
): Promise<UserStats> {
    try {
        // 1. ユーザーの直接の紹介者を取得
        const { data: referrals } = await supabase
            .from('users')
            .select('id, investment_amount')
            .eq('referrer_id', userId);

        // 2. 各系列の投資額を計算
        const lineInvestments = await Promise.all(
            referrals?.map(async (referral: Referral) => {
                const stats = await calculateUserStats(referral.id, supabase);
                return {
                    id: referral.id,
                    investment: referral.investment_amount + stats.totalInvestment,
                    subLines: stats.totalInvestment
                };
            }) || []
        );

        // 3. 最大系列と他系列の投資額を計算
        const sortedLines = lineInvestments.sort((a, b) => b.investment - a.investment);
        const maxLine = sortedLines[0]?.investment || 0;
        const otherLines = sortedLines.slice(1).reduce((sum, line) => sum + line.investment, 0);

        // 4. 合計投資額を計算
        const totalInvestment = lineInvestments.reduce((sum, line) => sum + line.investment, 0);

        return {
            maxLine,
            otherLines,
            totalInvestment
        };
    } catch (error) {
        console.error('Error calculating user stats:', error);
        throw error;
    }
} 