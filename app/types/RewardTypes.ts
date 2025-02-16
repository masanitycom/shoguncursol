// 報酬のステータスを列挙型として定義
export enum RewardStatus {
    WAITING = "WAITING",      // 待機期間中
    OPERATING = "OPERATING",  // 運用中
    PENDING = "PENDING",      // 報酬申請可能
    CLAIMED = "CLAIMED",      // 報酬申請済み
    DISTRIBUTED = "DISTRIBUTED", // 報酬支払済み
    FAILED = "FAILED"         // 失敗
}

// NFT運用状況の型を定義
export interface NFTOperation {
    id: string;
    name: string;
    nftId: string;
    userId: string;
    purchaseDate: Date;
    purchaseAmount: number;
    dailyRate: number;
    operationStartDate: Date;  // 運用開始日
    nextClaimStartDate: Date;  // 次回の報酬申請開始日
    nextClaimEndDate: Date;    // 次回の報酬申請終了日
    nextPaymentDate: Date;     // 次回の支払予定日
    accumulatedProfit: number; // 累積報酬
    status: RewardStatus;
    imageUrl?: string; // 画像URLを追加
    lastClaimDate?: Date;      // 最終報酬申請日
    lastPaymentDate?: Date;    // 最終支払日
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

// 型定義を確認させてください 