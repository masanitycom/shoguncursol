import { RewardCalculator } from '../lib/services/reward-calculator'
import type { NFTType } from '@/types/nft'

async function runExamples() {
    // NFTデータの作成
    const nft: NFTType = {
        name: 'SHOGUN NFT1000',
        price: 1000,
        maxDailyRate: 1.0,
        isLegacy: false,
        currentDailyRate: 0.5
    }

    // 1. 通常の日利計算
    const dailyReward = RewardCalculator.calculateDailyReward(nft)

    // 2. 複利での日利計算（タスク未完了の場合）
    const compoundReward = RewardCalculator.calculateCompoundInterest(1000, 0.5, 5)

    // 3. 分配金計算
    const profitShare = await RewardCalculator.calculateProfitSharing({
        totalProfit: 1000000,
        sharingAmount: 200000,
        weekStart: new Date(),
        weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    console.log({
        dailyReward,
        compoundReward,
        profitShare
    })
}

runExamples().catch(console.error) 