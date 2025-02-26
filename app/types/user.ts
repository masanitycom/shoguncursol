export interface LevelInfo {
    max_line_investment: number;
    other_lines_investment: number;
    investment_amount: number;
}

export interface LevelStats {
    level: string;
    maxLine: number;
    otherLines: number;
    personalInvestment: number;
}

export interface UserLevelParams {
    personalInvestment: number;
    maxLine: number;
    otherLines: number;
}

export interface UserProfile {
    id: string;
    email: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    referrer_id?: string;
}

export interface UserUpdatePayload {
    name?: string;
    email?: string;
    wallet_address?: string;
    wallet_type?: string;
    active?: boolean;
    password?: string;
}

export interface UserProfileUpdate {
    name?: string;
    email?: string;
    wallet_address?: string;
    wallet_type?: string;
    active?: boolean;
    password?: string;
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