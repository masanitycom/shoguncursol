export interface UserProfile {
    id: string;
    user_id: string;
    name: string;
    name_kana?: string;
    email: string;
    wallet_address: string | null;
    wallet_type: string | null;
    investment_amount: number;
    total_team_investment: number;
    max_line_investment: number;
    other_lines_investment: number;
    active: boolean;
    created_at: string;
    updated_at: string;
    display_id?: string;
    children?: UserProfile[];
}

export interface UserUpdatePayload {
    name?: string;
    email?: string;
    wallet_address?: string;
    wallet_type?: string;
    active?: boolean;
}

export interface UserProfileUpdate {
    name?: string;
    email?: string;
    wallet_address?: string;
    wallet_type?: string;
    active?: boolean;
}

export interface ProfileResponse {
    id: string;
    user_id: string;
    name: string;
    email: string;
    wallet_address: string;
    wallet_type: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LevelInfo {
    max_line_investment: number;
    other_lines_investment: number;
    investment_amount: number;
}

export interface UserLevelParams {
    personalInvestment: number;
    maxLine: number;
    otherLines: number;
}

export interface LevelStats {
    personalInvestment: number;
    maxLine: number;
    otherLines: number;
    teamInvestment: number;
    totalInvestment?: number;
    referralCount?: number;
    currentLevel?: string;
} 