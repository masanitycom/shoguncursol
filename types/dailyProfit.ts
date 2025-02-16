export interface DailyRate {
    date: string;
    nft_id: string;
    rate: number;
}

export interface WeeklyProfit {
    startDate: string;
    endDate: string;
    totalProfit: number;
    dailyProfits: {
        date: string;
        profit: number;
    }[];
} 