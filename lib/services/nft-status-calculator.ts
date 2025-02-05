import { calculateDailyRateStartDate } from './daily-rate-calculator'
import { NFTStatus, NFTStatusInfo } from '@/types/nft'

export function calculateNFTStatus(purchaseDate: Date): NFTStatusInfo {
    const today = new Date()
    const startDate = calculateDailyRateStartDate(purchaseDate)
    
    // 日付をフォーマットする関数
    const formatDate = (date: Date) => {
        return `${date.getMonth() + 1}月${date.getDate()}日`
    }

    if (today < startDate) {
        // 待機中の場合
        const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
            status: '待機中',
            startDate,
            daysUntilStart,
            message: `${formatDate(startDate)}より運用開始`
        }
    } else {
        // 運用中の場合
        return {
            status: '運用中',
            message: `${formatDate(startDate)}から運用中`
        }
    }
} 