import { NFTStatus, NFTStatusInfo } from '@/types/nft';

export function calculateNFTStatus(purchaseDate: Date): NFTStatusInfo {
    const today = new Date();
    const startDate = new Date(purchaseDate);
    startDate.setDate(startDate.getDate() + 7); // 運用開始は購入から1週間後

    if (today < startDate) {
        const daysUntilStart = Math.ceil(
            (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            status: '待機中',
            startDate,
            daysUntilStart,
            message: `${daysUntilStart}日後に運用開始`
        };
    }

    return {
        status: '運用中',
        message: '運用中'
    };
} 