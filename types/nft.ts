export type NFTOperationStatus = '待機中' | '運用中' | '報酬申請可能' | '報酬申請済み';

export interface NFTStatusInfo {
    status: NFTOperationStatus;
    operationStartDate: Date;      // 運用開始日
    nextRewardDate?: Date;         // 次回の報酬日
    rewardClaimStart?: Date;       // 報酬申請開始日
    rewardClaimEnd?: Date;         // 報酬申請終了日
    message: string;               // 表示メッセージ
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

// NFT購入から運用開始までのスケジュール計算
export const calculateNFTSchedule = (purchaseDate: Date): {
    operationStartDate: Date;
    firstRewardDisplayDate: Date;
    rewardClaimStartDate: Date;
    rewardClaimEndDate: Date;
    rewardDistributionDate: Date;
} => {
    // 2週間後の月曜日を計算
    const twoWeeksLater = new Date(purchaseDate);
    twoWeeksLater.setDate(purchaseDate.getDate() + 14);
    
    // 次の月曜日を取得
    const operationStartDate = new Date(twoWeeksLater);
    const daysUntilMonday = (8 - operationStartDate.getDay()) % 7;
    operationStartDate.setDate(operationStartDate.getDate() + daysUntilMonday);

    // 報酬表示日（運用開始から1週間後の月曜日）
    const firstRewardDisplayDate = new Date(operationStartDate);
    firstRewardDisplayDate.setDate(operationStartDate.getDate() + 7);

    // 報酬申請期間（報酬表示日から金曜日まで）
    const rewardClaimStartDate = new Date(firstRewardDisplayDate);
    const rewardClaimEndDate = new Date(firstRewardDisplayDate);
    rewardClaimEndDate.setDate(firstRewardDisplayDate.getDate() + 4); // 金曜日まで

    // 報酬配布日（申請期間終了後の次の月曜日）
    const rewardDistributionDate = new Date(rewardClaimEndDate);
    rewardDistributionDate.setDate(rewardClaimEndDate.getDate() + 3); // 次の月曜日

    return {
        operationStartDate,
        firstRewardDisplayDate,
        rewardClaimStartDate,
        rewardClaimEndDate,
        rewardDistributionDate
    };
}; 