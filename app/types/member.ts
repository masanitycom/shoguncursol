export interface Member {
    id: string;
    display_id: string;
    name: string;
    email: string;
    display_name: string;
    nft_purchase_requests?: NFTPurchaseRequest[];
    investment_amount?: number;
    total_team_investment?: number;
    max_line_investment?: number;
    other_lines_investment?: number;
    level?: string;
    referrer_id?: string;
}

export interface NFTPurchaseRequest {
    id: string;
    status: string; // 'pending' | 'approved' | 'rejected' として扱う
    nft_settings: NFTSettings;
    created_at: string;
    approved_at?: string;
}

export interface NFTSettings {
    id: string;
    price: number;
    name: string;
    daily_rate?: number;
}

export interface DailyRate {
    date: string;
    rate: number;
    nft_id: string;
}

export interface ProfitCalculation {
    daily_profit: number;
    cumulative_profit: number;
    roi_percentage: number;
} 