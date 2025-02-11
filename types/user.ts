export interface UserProfile {
    id: string;
    user_id: string;
    name: string;
    name_kana: string;
    email: string;
    wallet_address: string;
    wallet_type: string;
    active: boolean;
    created_at: string;
    updated_at: string;
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