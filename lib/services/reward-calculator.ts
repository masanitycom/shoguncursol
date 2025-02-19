import { supabase } from '@/lib/supabase';
import { LEVEL_REQUIREMENTS } from '@/lib/constants/levels';
import { NFTType } from '@/types/nft';
import { calculateUserLevel, UserLevelResult } from '@/lib/utils/userLevel';
import type { UserNFT } from '@/types/nft';

// データベースから取得するNFTの型を定義
interface UserNFTData {
    id: string;
    nftType: NFTTypeFromDB;  // 配列ではなく単一のオブジェクト
}

// DBから取得するNFT型の定義
interface NFTTypeFromDB {
    id: string;
    name: string;
    price: string | number;
    maxDailyRate: string | number;
    isLegacy: boolean;
    currentDailyRate: string | number;
}

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
        share_rate: number;
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
    // 基本的な報酬計算
    static calculateReward(investment: number, rate: number): number {
        return investment * (rate / 100);
    }

    // 日次報酬の計算
    static calculateDailyReward(nftData: NFTType): number {
        return this.calculateReward(nftData.price, nftData.currentDailyRate);
    }

    // 複利計算
    static calculateCompoundInterest(
        principal: number,
        rate: number,
        days: number
    ): number {
        const dailyRate = rate / 100;
        return principal * Math.pow(1 + dailyRate, days);
    }

    // 利益分配の計算
    static async calculateProfitSharing(params: {
        totalProfit: number;
        sharingAmount: number;
        weekStart: Date;
        weekEnd: Date;
    }): Promise<number> {
        return Promise.resolve(params.sharingAmount);
    }

    // ユーザーレベルに基づく報酬率の取得
    static getLevelShareRate(level: string): number {
        const levelReq = LEVEL_REQUIREMENTS.find(l => l.name === level);
        return levelReq?.shareRate || 0;
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
                    const levelInfo: UserLevelResult = await calculateUserLevel(user.user_id);
                    return {
                        user_id: user.user_id,
                        level: {
                            name: levelInfo.level,
                            share_rate: levelInfo.stats.totalInvestment
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
                nftType:nft_type (
                    id,
                    name,
                    price,
                    maxDailyRate,
                    isLegacy,
                    currentDailyRate
                )
            `)
            .eq('userId', userId)
            .eq('isActive', true);

        // 型アサーションを2段階で行う
        const typedUserNfts = (userNfts as unknown) as UserNFTData[];

        const totalDailyRewards = (typedUserNfts || []).reduce((sum, nft) => {
            if (!nft.nftType) return sum;

            // NFTTypeに変換
            const nftData: NFTType = {
                id: nft.nftType.id || `nft-${nft.id}`,  // idを追加
                name: nft.nftType.name,
                price: Number(nft.nftType.price),
                maxDailyRate: Number(nft.nftType.maxDailyRate),
                isLegacy: nft.nftType.isLegacy || false,
                currentDailyRate: Number(nft.nftType.currentDailyRate) || 0.5
            };

            return sum + this.calculateDailyReward(nftData);
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

        const level = LEVEL_REQUIREMENTS.find((l: { name: string; shareRate: number }) => l.name === userLevel.level);
        if (!level) return 0;

        return level.shareRate / 100;
    }

    // ユーザーの報酬計算
    static async calculateUserRewards(userNFTs: UserNFT[]) {
        try {
            const rewards = await Promise.all(userNFTs.map(async nft => {
                if (!nft.nftType) return null;

                // NFTTypeに変換（idを必ず含める）
                const nftData: NFTType = {
                    id: nft.nftType.id || `nft-${nft.id}`, // nftのIDをフォールバックとして使用
                    name: nft.nftType.name,
                    price: Number(nft.nftType.price),
                    maxDailyRate: Number(nft.nftType.maxDailyRate),
                    currentDailyRate: Number(nft.nftType.currentDailyRate || 0),
                    isLegacy: Boolean(nft.nftType.isLegacy)
                };

                const dailyReward = this.calculateDailyReward(nftData);
                const compoundReward = this.calculateCompoundInterest(
                    nftData.price,
                    nftData.currentDailyRate || 0,
                    5 // 営業日数
                );

                return {
                    nftId: nft.id,
                    dailyReward,
                    compoundReward
                };
            }));

            return rewards.filter(Boolean);
        } catch (error) {
            console.error('Error calculating user rewards:', error);
            throw error;
        }
    }
}

// 使用例は examples/reward-calculator-example.ts に移動しました 