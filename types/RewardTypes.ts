// NFT運用状況の型を更新
export interface NFTOperation {
    id: string;
    nft_id: string;
    user_id: string;
    status: 'waiting' | 'active' | 'completed' | 'suspended';
    purchase_amount: number;
    current_profit: number;
    profit_percentage: number;
    purchase_date: Date;
    operation_start_date: Date;
    last_reward_date: Date | null;
}

// ユーザーレベル情報の型を追加
export interface UserLevelInfo {
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
} 