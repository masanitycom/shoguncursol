// NFT運用状況の型を更新
export const RewardStatus = {
    ACTIVE: 'active',
    PENDING: 'pending',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended'
} as const;

export type RewardStatus = typeof RewardStatus[keyof typeof RewardStatus];

export interface NFTOperation {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    currentDailyRate?: number;
    image_url: string | null;
    created_at: string;
    status: RewardStatus;
    purchaseAmount?: number;
    accumulatedProfit?: number;
    lastClaimDate?: string;
    lastPaymentDate?: string;
    operationStartDate?: string;
    nextClaimStartDate?: string;
    nextClaimEndDate?: string;
    nextPaymentDate?: string;
    purchaseDate?: string;
}

// ユーザーレベル情報の型を追加
export interface UserLevelInfo {
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
} 