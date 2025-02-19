export interface DailyRate {
    id: string;
    date: string;
    rate: number;
    nft_id: string;
}

export interface DailyProfit {
    id: string;
    amount: number;
    date: string;
    user_id: string;
    nft_id: string;
    is_weekly: boolean;
}

export interface WeeklyProfit {
    totalProfit: number;
    startDate: string;
    endDate: string;
    dailyProfits: DailyProfit[];
}

// 型ガード関数
export const isWeeklyProfit = (obj: DailyProfit | null): boolean => {
    if (!obj) return false;  // nullチェックを追加
    return obj.is_weekly;
}

export const validProfits = (profits: DailyProfit[] | null): DailyProfit[] => {
    if (!profits) return [];
    return profits.filter(profit => profit !== null);
} 