import { supabase } from '../supabase';
import { LevelCalculator } from './level-calculator';
import { LEVELS, Level } from '../constants/levels';
import type { NFTType, UserNFT, DailyRate, NFTDailyProfit } from '@/types/nft';

interface WeeklyProfitShare {
    totalProfit: number;        // 会社の総利益
    sharingAmount: number;      // 分配総額（総利益の20%）
    weekStart: Date;
    weekEnd: Date;
}

interface UserLevelInfo {
    user_id: string;
    level: {
        name: string;
        share_rate: number;          // 分配率（例：45 = 45%）
    };
}

interface NFTMaster {
    price: number
}

interface NFTDailyLimit {
    nftType: string;
    maxDailyReward: number;
}

interface NFTDailyRate {
    nftType: string;
    price: number;
    maxDailyRate: number;  // パーセンテージで指定
}

// NFT毎の日利上限を定義（%）
const NFT_DAILY_RATES: { [key: string]: number } = {
    'SHOGUN NFT300': 0.5,    // 0.5%/日
    'SHOGUN NFT500': 0.5,    // 0.5%/日
    'SHOGUN NFT1000': 1.0,   // 1.0%/日
    'SHOGUN NFT3000': 1.0,   // 1.0%/日
    'SHOGUN NFT5000': 1.0,   // 1.0%/日
    'SHOGUN NFT10000': 1.25, // 1.25%/日
    'SHOGUN NFT30000': 1.5,  // 1.5%/日
    'SHOGUN NFT50000': 1.75, // 1.75%/日
    'SHOGUN NFT100000': 2.0  // 2.0%/日
};

export class RewardCalculator {
    // 日利計算（NFTタイプに基づく）
    static calculateDailyReward(nftType: NFTType, dailyRate: number): number {
        const maxRate = NFT_DAILY_RATES[nftType.name] || 0.5;
        const effectiveRate = Math.min(dailyRate, maxRate, nftType.maxDailyRate);
        return nftType.price * (effectiveRate / 100);
    }

    // 複利計算
    static calculateCompoundInterest(
        principal: number,
        dailyRate: number,
        days: number
    ): number {
        return principal * Math.pow(1 + dailyRate / 100, days);
    }

    // ユーザーレベル情報の取得
    static async getUserLevels(): Promise<UserLevelInfo[]> {
        try {
            const { data: users, error } = await supabase
                .from('user_nfts')
                .select(`
                    user_id,
                    nft_type (
                        id,
                        name,
                        price,
                        maxDailyRate
                    )
                `)
                .eq('isActive', true);
            
            if (error) throw error;

            const usersWithLevels = await Promise.all(
                (users || []).map(async (user) => {
                    const level = await LevelCalculator.calculateUserLevel(user.user_id);
                    return {
                        user_id: user.user_id,
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
    static calculateTotalSharesByLevel(userLevels: UserLevelInfo[]): { [key: string]: number } {
        return userLevels.reduce((acc, user) => {
            const levelName = user.level.name;
            if (levelName !== 'なし') {
                acc[levelName] = (acc[levelName] || 0) + user.level.share_rate;
            }
            return acc;
        }, {} as { [key: string]: number });
    }

    // 分配金計算
    static async calculateProfitSharing(params: WeeklyProfitShare): Promise<number> {
        const { totalProfit, sharingAmount } = params;
        return sharingAmount * 0.2;
    }

    // 総報酬計算
    static async calculateTotalRewards(
        userId: string,
        weekStart: Date,
        today: Date
    ): Promise<{
        dailyRewards: number;
        unificationBonus: number;
        total: number;
    }> {
        const { data: userNfts } = await supabase
            .from('user_nfts')
            .select(`
                id,
                nftType:nft_type (*)
            `)
            .eq('userId', userId)
            .eq('isActive', true);

        const totalDailyRewards = (userNfts || []).reduce((sum, nft) => {
            if (!nft.nftType) return sum;
            return sum + this.calculateDailyReward(nft.nftType, 0.5);
        }, 0);

        const unificationBonus = await this.calculateUnificationBonus(userId);

        return {
            dailyRewards: totalDailyRewards,
            unificationBonus,
            total: totalDailyRewards + unificationBonus
        };
    }

    // 天下統一ボーナス計算
    private static async calculateUnificationBonus(userId: string): Promise<number> {
        const { data: userLevel } = await supabase
            .from('user_levels')
            .select('level')
            .eq('user_id', userId)
            .single();

        if (!userLevel) return 0;

        const level = LEVELS.find(l => l.name === userLevel.level);
        if (!level) return 0;

        return level.shareRate / 100;
    }
}

// 使用例は examples/reward-calculator-example.ts に移動しました 