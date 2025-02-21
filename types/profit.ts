import { RankLevel } from './organization';

// 週次利益の設定
export interface WeeklyProfitSettings {
    weekStart: string;
    weekEnd: string;
    totalProfit: number;
    shareRate: 20 | 22 | 25 | 30;
}

// 天下統一ボーナスの分配結果
export interface BonusDistribution {
    rank: RankLevel;
    userCount: number;
    totalAmount: number;
    perUserAmount: number;
}

// 分配計算の結果
export interface DistributionResult {
    success: boolean;
    weeklyProfitId?: string;
    distributions?: BonusDistribution[];
    error?: any;
}

// データベース用の型
export interface WeeklyProfitRecord {
    id: string;
    week_start: string;
    week_end: string;
    total_profit: number;
    share_rate: number;
    distribution_amount: number;
    created_at: string;
}

export interface ConquestBonusRecord {
    id: string;
    user_id: string;
    weekly_profit_id: string;
    rank: RankLevel;
    amount: number;
    status: 'pending' | 'paid';
    created_at: string;
} 