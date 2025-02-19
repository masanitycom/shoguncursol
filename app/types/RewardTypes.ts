// 報酬のステータスを列挙型として定義
export enum RewardStatus {
    WAITING = "WAITING",      // 待機期間中
    OPERATING = "OPERATING",  // 運用中
    PENDING = "PENDING",      // 報酬申請可能
    CLAIMED = "CLAIMED",      // 報酬申請済み
    DISTRIBUTED = "DISTRIBUTED", // 報酬支払済み
    FAILED = "FAILED",        // 失敗
    SUSPENDED = "suspended"   // 停止中
}

// NFT運用状況の型を定義
export interface NFTOperation {
    id: string;
    nftId: string;
    userId: string;
    operationType: 'purchase' | 'transfer' | 'sale';
    status: RewardStatus;
    amount: number;
    createdAt: string;
    updatedAt: string;
    startDate?: string;
    endDate?: string;
}

export interface NFTOperationResponse {
    success: boolean;
    message: string;
    operation?: NFTOperation;
}

// ユーザーランクの列挙型
export enum UserRank {
    NONE = "なし",
    ASHIGARU = "足軽",
    BUSHO = "武将",
    DAIKAN = "代官",
    BUGYO = "奉行",
    ROCHU = "老中",
    DAIMYO = "大名",
    SHOGUN = "将軍"
}

// NFT運用状況の計算結果の型を定義
export interface NFTOperationStatus {
    operationStartDate: Date;
    nextClaimStartDate: Date;
    nextClaimEndDate: Date;
    nextPaymentDate: Date;
    status: RewardStatus;
    accumulatedProfit: number;
}

// 型定義を確認させてください 