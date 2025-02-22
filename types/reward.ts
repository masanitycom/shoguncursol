// 報酬タイプの定義
export type RewardType = 'daily' | 'conquest' | 'airdrop';

// 基本の報酬インターフェース
export interface BaseReward {
    id: string;
    userId: string;
    displayId: string;
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    createdAt: Date;
    paidAt?: Date;
}

// 日次報酬
export interface DailyReward extends BaseReward {
    type: 'daily';
    nftId: string;
    dailyRate: number;
    targetDate: Date;
}

// 天下統一ボーナス
export interface ConquestReward extends BaseReward {
    type: 'conquest';
    achievement: {
        maxLine: number;
        otherLines: number;
        totalTeam: number;
    };
    bonusRate: number;
}

// 週次報酬集計
export interface WeeklyReward {
    id: string;
    weekId: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'paid';
    rewards: {
        daily: DailyReward[];
        conquest: ConquestReward[];
        airdrop: BaseReward[];
    };
    summary: {
        totalAmount: number;
        byType: {
            daily: number;
            conquest: number;
            airdrop: number;
        };
        userCount: number;
    };
}

// 報酬履歴
export interface RewardHistory {
    id: string;
    weekId: string;
    paidAt: Date;
    details: {
        totalAmount: number;
        byType: {
            daily: number;
            conquest: number;
            airdrop: number;
        };
        userCount: number;
    };
}

// データベーステーブル定義
export interface WeeklyRewardsTable {
    id: string;
    week_id: string;
    start_date: Date;
    end_date: Date;
    total_amount: number;
    daily_rewards_amount: number;
    conquest_rewards_amount: number;
    airdrop_amount: number;
    user_count: number;
    status: 'pending' | 'paid';
    created_at: Date;
    paid_at?: Date;
}

export type ProfitShareRate = 20 | 22 | 25 | 30;

export interface WeeklyPayoutSummary {
    weekId: string;
    startDate: Date;
    endDate: Date;
    companyProfit: number;  // 会社の総利益
    payouts: {
        // NFTの日次報酬
        dailyRewards: {
            total: number;
            userCount: number;
            details: Array<{
                nftType: string;
                amount: number;
                count: number;
            }>;
        };
        // 天下統一ボーナス
        unificationBonus: {
            poolAmount: number;  // 分配原資（20-30%）
            totalAmount: number; // 実際の分配総額
            distributions: Array<{
                level: string;
                userCount: number;
                amount: number;
                perUser: number;
            }>;
        };
    };
    totalPayoutAmount: number;  // 支払い総額
}

// 週間利益のプレビュー用
export interface WeeklyProfitPreview {
    weekStartDate: Date;
    weekEndDate: Date;
    companyProfit: number;      
    distributionRate: number;    
    distributions: {
        unificationBonus: {
            total: number;
            byLevel: Array<{
                level: string;
                userCount: number;
                amount: number;
                perUser: number;
                users: Array<{
                    id: string;
                    display_id: string;
                    name: string;
                }>;
            }>;
        };
    };
    totalDistribution: number;
}

// NFT関連の型
export interface NFTSettings {
    price: number;
    daily_rate: number;
    operation_start_date: string;
}

export interface NFTPurchaseRequest {
    id: string;
    status: string;
    nft_settings: NFTSettings;
}

// 天下統一ボーナス関連の型
export interface WeeklyProfit {
    id: string;
    week_start: Date;
    week_end: Date;
    total_profit: number;
    share_rate: number;
    distribution_amount: number;
    payment_date: Date;
    distributions: {
        [level: string]: {
            userCount: number;
            amount: number;
            perUser: number;
            users: string[];  // ユーザーID配列
        };
    };
    created_at: Date;
}

// ユーザーの報酬関連の型
export interface UserReward {
    id: string;
    user_id: string;
    amount: number;
    type: 'daily' | 'conquest' | 'airdrop';
    status: 'pending' | 'requested' | 'paid';
    created_at: Date;
    paid_at?: Date;
}

// 保留中の報酬の集計用
export interface PendingRewards {
    daily: number;
    conquest: number;
    total: number;
}

export interface DashboardData {
    id: string;
    nft_settings: NFTSettings;
    investmentInfo: {
        investment_amount: number;
        max_line_investment: number;
        other_lines_investment: number;
    };
    currentLevel: string;
    profile: {
        id: string;
        display_id: string;
        name: string;
        email: string;
    };
} 