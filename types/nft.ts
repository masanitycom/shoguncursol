import { 
    startOfWeek, 
    addWeeks, 
    addMonths, 
    addDays 
} from 'date-fns';

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
export const calculateNFTSchedule = (purchaseDate: Date) => {
    // 運用開始日: 購入日の翌々週月曜日
    const operationStartDate = startOfWeek(addWeeks(purchaseDate, 2), { weekStartsOn: 1 });

    // 報酬申請期間の計算
    const rewardClaimStartDate = addMonths(operationStartDate, 1);
    const rewardClaimEndDate = addDays(rewardClaimStartDate, 6);

    return {
        operationStartDate,
        rewardClaimStartDate,
        rewardClaimEndDate
    };
}; 