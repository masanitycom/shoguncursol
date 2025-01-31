import { supabase } from '../supabase';
import { LevelCalculator } from './level-calculator';

interface WeeklyProfitShare {
    totalProfit: number;        // 会社の総利益
    sharingAmount: number;      // 分配総額（総利益の20%）
    weekStart: Date;
    weekEnd: Date;
}

interface UserLevel {
    name: string;
    shareRate: number;          // 分配率（例：45 = 45%）
    requirements: {
        nftAmount: number;      // 必要NFT額（1000以上）
        maxLine: number;        // 最大系列必要額
        otherLines: number;     // 他系列必要額
    }
}

interface NFTMaster {
    price: number
}

interface UserNFT {
    nft_master: NFTMaster
}

// レベル定義
const LEVELS: UserLevel[] = [
    {
        name: '足軽',
        shareRate: 45,
        requirements: {
            nftAmount: 1000,
            maxLine: 1000,      // 組織全体で1000ドル以上
            otherLines: 0
        }
    },
    {
        name: '武将',
        shareRate: 25,
        requirements: {
            nftAmount: 1000,
            maxLine: 3000,      // 最大系列3000ドル
            otherLines: 1500    // 他系列全体で1500ドル
        }
    },
    // ... 他のレベル定義
];

export class RewardCalculator {
    // 日利計算（複利考慮）
    static calculateDailyReward(
        nftAmount: number,
        dailyRate: number,
        isCompound: boolean = false
    ): number {
        const baseAmount = isCompound ? nftAmount : nftAmount
        const maxDailyReward = baseAmount * 0.005 // 上限0.5%
        const calculatedReward = baseAmount * (dailyRate / 100)
        return Math.min(calculatedReward, maxDailyReward)
    }

    // 週次利益からの分配金計算
    static async calculateProfitSharing(weeklyProfit: WeeklyProfitShare) {
        const sharingAmount = weeklyProfit.totalProfit * 0.2; // 総利益の20%を分配

        // 1. 各レベルのユーザーを取得
        const userLevels = await this.getUserLevels();
        
        // 2. レベルごとの合計分配率を計算
        const totalSharesByLevel = this.calculateTotalSharesByLevel(userLevels);

        // 3. ユーザーごとの分配金を計算
        return this.calculateUserShares(userLevels, sharingAmount, totalSharesByLevel);
    }

    // 複利計算（タスク未完了の場合）
    static calculateCompoundInterest(baseAmount: number, dailyRate: number, days: number) {
        let amount = baseAmount;
        for (let i = 0; i < days; i++) {
            const dailyReward = this.calculateDailyReward(amount, dailyRate, true);
            amount += dailyReward;
        }
        return amount;
    }

    // ユーザーレベル情報の取得を修正
    static async getUserLevels() {
        try {
            // user_dataテーブルから直接取得
            const { data, error } = await supabase
                .from('user_data')
                .select(`
                    id,
                    name,
                    investment,
                    referrer
                `);
            
            if (error) throw error;

            // レベルを計算
            const usersWithLevels = await Promise.all(
                (data || []).map(async (user) => {
                    const level = await LevelCalculator.calculateUserLevel(user.id);
                    return {
                        user_id: user.id,
                        level: {
                            name: level?.name || 'なし',
                            share_rate: level?.shareRate || 0
                        }
                    };
                })
            );

            return usersWithLevels;
        } catch (error) {
            console.error('Error fetching user levels:', error);
            return [];
        }
    }

    // レベルごとの合計分配率を計算
    static calculateTotalSharesByLevel(userLevels: any[]) {
        return userLevels.reduce((acc, user) => {
            const levelName = user.level.name;
            if (levelName !== 'なし') {
                acc[levelName] = (acc[levelName] || 0) + user.level.share_rate;
            }
            return acc;
        }, {});
    }

    // ユーザーごとの分配金を計算
    static calculateUserShares(userLevels: any[], totalAmount: number, totalSharesByLevel: any) {
        return userLevels.map(user => ({
            user_id: user.user_id,
            level_name: user.level.name,
            share_amount: totalAmount * (user.level.share_rate / totalSharesByLevel[user.level.name])
        }));
    }

    // 天下統一ボーナス計算
    static calculateUnificationBonus(
        totalInvestment: number,
        companyProfit: number
    ): number {
        // 投資額に応じたボーナス率を計算
        const bonusRate = this.calculateBonusRate(totalInvestment)
        return companyProfit * bonusRate
    }

    // ボーナス率計算
    private static calculateBonusRate(totalInvestment: number): number {
        if (totalInvestment >= 100000) return 0.05  // 5%
        if (totalInvestment >= 50000) return 0.03   // 3%
        if (totalInvestment >= 10000) return 0.01   // 1%
        return 0
    }

    // 総報酬計算
    static async calculateTotalRewards(
        userId: string,
        weekStart: Date,
        today: Date
    ): Promise<{
        dailyRewards: number
        unificationBonus: number
        total: number
    }> {
        // NFT投資額を取得
        const { data: rawNftData } = await supabase
            .from('user_nfts')
            .select(`
                nft_master!inner (
                    price
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')

        // データを適切な型に変換
        const nftData: UserNFT[] = (rawNftData || []).map(item => ({
            nft_master: {
                price: item.nft_master[0]?.price || 0
            }
        }))

        // 総投資額を計算
        const totalInvestment = nftData.reduce(
            (sum, nft) => sum + nft.nft_master.price,
            0
        )

        // 日利を計算（仮の日利率0.5%を使用）
        const dailyRewards = this.calculateDailyReward(
            totalInvestment,
            0.5,  // 日利率
            false // 複利なし
        )

        // 会社の利益を取得（仮の実装）
        const { data: profitData } = await supabase
            .from('company_profits')
            .select('profit')
            .eq('week_start', weekStart.toISOString().split('T')[0])
            .single()

        const companyProfit = profitData?.profit || 0

        // 天下統一ボーナスを計算
        const unificationBonus = this.calculateUnificationBonus(
            totalInvestment,
            companyProfit
        )

        return {
            dailyRewards,
            unificationBonus,
            total: dailyRewards + unificationBonus
        }
    }
}

// 使用例は examples/reward-calculator-example.ts に移動しました 