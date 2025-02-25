import { UserProfile } from './user';  // UserProfile型をインポート

export interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string | null;
}

export interface NFTMasterData {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url?: string;
}

export interface NFTPurchaseRequestData {
    id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_at: string;
    approved_at: string | null;
    nft_master: {
        id: string;
        name: string;
        price: string | number;  // APIからの値は文字列
        daily_rate: string | number;
        image_url?: string;
    };
}

export interface OrganizationMember {
    id: string;
    name: string;
    display_id: string;
    max_line_investment: number;
    other_lines_investment: number;
    investment_amount: number;  // total_investment の代わり
    team_investment: number;    // total_team_investment の代わり
    total_investment?: number;  // 互換性のため
    total_team_investment?: number;  // 互換性のため
    children: OrganizationMember[];
    nft_purchase_requests: NFTPurchaseRequest[];
}

export interface NFTMaster {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url?: string;
    description?: string;
}

export interface NFTPurchaseRequest {
    id: string;
    status: 'approved' | 'pending' | 'rejected';
    created_at: string;
    approved_at: string | null;
    nft_master: NFTMaster;
}

export interface NFTWithReward {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    purchase_date: string;
    reward_claimed: boolean;
    image_url: string;
    description?: string;
    status: string;
    approved_at: string | null;
    lastWeekReward: number;
    nft_master: NFTMaster;
}

export interface DashboardData {
    profile: UserProfile | null;
    nfts: NFTPurchaseRequestData[];
    investmentData: InvestmentInfo;
}

export interface InvestmentInfo {
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
}

interface NFTMaster {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    status: string;
    description?: string | null;
} 