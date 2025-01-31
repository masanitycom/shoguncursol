import { RewardCalculator } from '../lib/services/reward-calculator'

async function runExamples() {
    // 1. 通常の日利計算
    const dailyReward = RewardCalculator.calculateDailyReward(1000, 0.5)

    // 2. 複利での日利計算（タスク未完了の場合）
    const compoundReward = RewardCalculator.calculateCompoundInterest(1000, 0.5, 5)

    // 3. 週次利益からの分配金計算
    const profitShares = await RewardCalculator.calculateProfitSharing({
        totalProfit: 10000000,
        sharingAmount: 2000000,
        weekStart: new Date('2024-01-01'),
        weekEnd: new Date('2024-01-07')
    })
} 