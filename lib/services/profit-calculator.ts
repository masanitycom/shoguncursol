import { supabase } from '@/lib/supabase';
import { isBusinessDay } from './nft-status-calculator';

interface WeeklyProfit {
    totalProfit: number;
    startDate: Date;
    endDate: Date;
    dailyProfits: {
        date: Date;
        rate: number;
        profit: number;
    }[];
}

export async function calculateWeeklyProfit(
    nftId: string,
    nftPrice: number,
    operationStartDate: Date
): Promise<WeeklyProfit> {
    // 運用開始週の月曜から金曜までの日付を取得
    const weekStartDate = new Date(operationStartDate);
    const weekEndDate = new Date(operationStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4); // 金曜日

    // 日利データを取得
    const { data: dailyRates, error } = await supabase
        .from('daily_rates')
        .select('*')
        .eq('nft_id', nftId)
        .gte('date', weekStartDate.toISOString())
        .lte('date', weekEndDate.toISOString());

    if (error) throw error;

    // 日次の利益を計算
    const dailyProfits = dailyRates?.map(rate => {
        const dailyProfit = nftPrice * (rate.rate / 100);
        return {
            date: new Date(rate.date),
            rate: rate.rate,
            profit: dailyProfit
        };
    }) || [];

    // 週間の合計利益を計算
    const totalProfit = dailyProfits.reduce((sum, day) => sum + day.profit, 0);

    return {
        totalProfit,
        startDate: weekStartDate,
        endDate: weekEndDate,
        dailyProfits
    };
}

// 報酬表示日を計算（運用週の次の月曜日）
export function calculateProfitDisplayDate(operationStartDate: Date): Date {
    const displayDate = new Date(operationStartDate);
    displayDate.setDate(displayDate.getDate() + 7); // 次の週の月曜日
    return displayDate;
} 