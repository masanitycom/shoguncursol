import { DailyRate, WeeklyProfit } from '@/types/dailyProfit';
import { supabase } from '@/lib/supabase';

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

        const dailyProfits = (dailyRates as DailyRate[]).map(rate => ({
            date: rate.date,
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