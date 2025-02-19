// 購入リクエストの状態を定義
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

// NFTの型定義
export interface NFTInfo {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
}

// ユーザー情報の型定義
export interface UserInfo {
    id: string;
    name: string | null;
    email: string;
    display_id?: string;
}

// 購入リクエストの型定義
export interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: RequestStatus;
    created_at: string;
    approved_at: string | null;
    rejected_at: string | null;
    rejection_reason: string | null;
    payment_method: string;
    price: number | null;
    user?: UserInfo;
    nft?: NFTInfo;
}

// 既存のNFTPurchaseRequestを削除し、PurchaseRequestを使用
export type NFTPurchaseRequest = PurchaseRequest; 