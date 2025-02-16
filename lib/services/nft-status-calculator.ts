import { NFTStatus, NFTStatusInfo } from '@/types/nft';

export function calculateNFTStatus(purchaseDate: Date): NFTStatusInfo {
    const today = new Date();
    
    // 購入日から1週間後の日付を計算
    const oneWeekLater = new Date(purchaseDate);
    oneWeekLater.setDate(purchaseDate.getDate() + 7);
    
    // 1週間後の次の月曜日を取得（運用開始日）
    const operationStartDate = new Date(oneWeekLater);
    const dayOfWeek = operationStartDate.getDay(); // 0 = 日曜日, 1 = 月曜日, ...
    
    if (dayOfWeek === 0) { // 日曜日の場合
        operationStartDate.setDate(operationStartDate.getDate() + 1);
    } else if (dayOfWeek > 1) { // 火曜日以降の場合
        operationStartDate.setDate(operationStartDate.getDate() + (8 - dayOfWeek));
    }
    
    // 日付をフォーマットする関数
    const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    };

    if (today < operationStartDate) {
        // 待機中の場合
        const daysUntilStart = Math.ceil(
            (operationStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            status: '待機中',
            startDate: operationStartDate,
            daysUntilStart,
            message: `${formatDate(operationStartDate)}より運用開始`
        };
    } else {
        // 運用中の場合
        return {
            status: '運用中',
            message: `${formatDate(operationStartDate)}から運用中`
        };
    }
}

// 営業日（月-金）かどうかをチェック
export function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // 月曜日から金曜日
} 