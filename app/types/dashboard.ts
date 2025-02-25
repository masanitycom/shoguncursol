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

export interface UserProfile {
    id: string;
    email: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    referrer_id?: string;
} 