export function calculateNFTTimeline(purchaseDate: Date): NFTTimeline {
    // 運用開始日を計算（購入日から2週間後の月曜日）
    const operationStart = new Date(purchaseDate);
    operationStart.setDate(operationStart.getDate() + 14);
    while (operationStart.getDay() !== 1) { // 1は月曜日
        operationStart.setDate(operationStart.getDate() + 1);
    }

    // 最初の報酬表示日（運用開始から1週間後の月曜日）
    const firstRewardDisplay = new Date(operationStart);
    firstRewardDisplay.setDate(firstRewardDisplay.getDate() + 7);

    // 報酬申請期間（報酬表示日から同じ週の金曜日まで）
    const claimStart = new Date(firstRewardDisplay);
    const claimEnd = new Date(firstRewardDisplay);
    while (claimEnd.getDay() !== 5) { // 5は金曜日
        claimEnd.setDate(claimEnd.getDate() + 1);
    }

    // 報酬配布日（申請期間終了後の次の月曜日）
    const distribution = new Date(claimEnd);
    distribution.setDate(distribution.getDate() + 3); // 金曜日から3日後が月曜日

    return {
        purchase_date: purchaseDate,
        operation_start_date: operationStart,
        first_reward_display_date: firstRewardDisplay,
        first_reward_claim_start: claimStart,
        first_reward_claim_end: claimEnd,
        first_reward_distribution: distribution
    };
}

export function getNFTStatus(nft: any): NFTStatus {
    const timeline = calculateNFTTimeline(new Date(nft.purchase_date));
    const now = new Date();

    // 現在が土日かどうかチェック
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (now < timeline.operation_start_date) {
        return {
            status: 'waiting',
            next_action_date: timeline.operation_start_date,
            message: `運用開始まで待機中（${timeline.operation_start_date.toLocaleDateString()}から運用開始）`
        };
    }

    if (now >= timeline.first_reward_claim_start && now <= timeline.first_reward_claim_end && !isWeekend) {
        return {
            status: 'claim_available',
            next_action_date: timeline.first_reward_claim_end,
            message: 'エアドロタスク申請可能期間です'
        };
    }

    return {
        status: 'active',
        message: '運用中'
    };
}

// 報酬申請が可能かどうかをチェック
export function canClaimReward(): boolean {
    const now = new Date();
    const day = now.getDay();
    return day >= 1 && day <= 5; // 月曜日(1)から金曜日(5)まで
} 