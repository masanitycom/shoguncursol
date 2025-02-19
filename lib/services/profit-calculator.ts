import { supabase } from '@/lib/supabase';
import { DailyRate, DailyProfit, WeeklyProfit } from '@/types/dailyProfit';

// WeeklyProfitの計算関数をエクスポート
export async function calculateWeeklyProfit(
    nftId: string,
    nftPrice: number,
    operationStartDate: Date
): Promise<WeeklyProfit> {
    const weekStartDate = new Date(operationStartDate);
    const weekEndDate = new Date(operationStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 4);

    const { data: dailyRates, error } = await supabase
        .from('daily_rates')
        .select('*')
        .eq('nft_id', nftId)
        .gte('date', weekStartDate.toISOString())
        .lte('date', weekEndDate.toISOString());

    if (error) throw error;

    const dailyProfits: DailyProfit[] = dailyRates?.map(rate => ({
        date: rate.date,
        rate: rate.rate,
        profit: nftPrice * (rate.rate / 100)
    })) || [];

    return {
        totalProfit: dailyProfits.reduce((sum, day) => sum + day.profit, 0),
        startDate: weekStartDate.toISOString(),
        endDate: weekEndDate.toISOString(),
        dailyProfits
    };
}

export class ProfitCalculator {
    static async calculateWeeklyProfit(
        nftId: string,
        startDate: Date,
        endDate: Date
    ): Promise<WeeklyProfit> {
        const { data: dailyRates, error } = await supabase
            .from('daily_rates')
            .select('*')
            .eq('nft_id', nftId)
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString());

        if (error) throw error;

        const dailyProfits: DailyProfit[] = (dailyRates as DailyRate[]).map(rate => ({
            date: rate.date,
            rate: rate.rate,
            profit: rate.rate
        }));

        const totalProfit = dailyProfits.reduce((sum, day) => sum + day.profit, 0);

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalProfit,
            dailyProfits
        };
    }
}

export class RewardCalculator {
    static calculateReward(investment: number, rate: number): number {
        return investment * (rate / 100);
    }

    static calculateProfitSharing(params: {
        totalProfit: number;
        sharingAmount: number;
        weekStart: Date;
        weekEnd: Date;
    }): Promise<number> {
        return Promise.resolve(params.sharingAmount);
    }
}

export function calculateProfitDisplayDate(operationStartDate: Date): Date {
    const displayDate = new Date(operationStartDate);
    displayDate.setDate(displayDate.getDate() + 7);
    return displayDate;
} 