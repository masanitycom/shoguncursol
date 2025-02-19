export type NFTStatus = '待機中' | '運用中' | '停止中'

export interface NFTStatusInfo {
    status: NFTStatus
    startDate?: Date        // 運用開始予定日
    daysUntilStart?: number // 開始までの残り日数
    message: string         // 表示メッセージ
}

export interface NFTType {
    id: string;
    name: string;
    price: number;
    maxDailyRate: number;
    currentDailyRate: number;
    isLegacy: boolean;
}

export interface UserNFT {
    id: string;
    nft_id: string;
    user_id: string;
    nft: NFTType;
    nftType?: NFTType;  // 後方互換性のために追加
}

export type DailyRate = {
  id: string
  nftTypeId: number
  date: Date
  rate: number
  weekId: string
}

export type NFTDailyProfit = {
  id: string
  userNftId: string
  date: Date
  rate: number
  profitAmount: number
  isAirdropped: boolean
}

export interface NFTSettings {
    id: string;
    name: string;
    description?: string;
    price: number;
    daily_rate: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface NFT {
    nft_id: string;
    user_id: string;
    approved_at: string;
    nft_settings: NFTSettings;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface NFTWithPurchaseInfo extends NFT {
    purchase_status?: 'pending' | 'approved' | 'rejected';
    purchase_date?: string;
    purchase_id?: string;
}

export interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_settings_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    nft_settings?: NFTSettings;
    user?: {
        email: string;
        name?: string;
    };
} 