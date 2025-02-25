import { supabase } from '@/lib/supabase'
import { PendingRewards } from '@/types/reward'
import { calculateNFTReward } from '@/lib/services/nft'
import { calculateUserLevel } from '@/lib/utils/userLevel'
import { LEVEL_REQUIREMENTS, CONQUEST_BONUS_RATES } from '@/lib/constants/levels'

interface NFTMaster {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
}

interface NFTPurchaseRequest {
    id: string;
    nft_master: NFTMaster;
}

// プロファイルの型定義を追加
interface Profile {
    id: string;
    email: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    level: string;
    nft_purchase_requests?: {
        id: string;
        status: string;
        nft_master: {
            id: string;
            price: number;
        };
    }[];
}

export const fetchPendingRewards = async (userId: string): Promise<PendingRewards> => {
    try {
        // プロファイルから投資額情報を取得
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
                investment_amount,
                max_line_investment,
                other_lines_investment
            `)
            .eq('id', userId)
            .single();

        console.log('プロファイル取得:', {
            profile,
            profileError,
            userId
        });

        if (profileError) throw profileError;

        // レベルを計算
        let userLevel = 'NONE';
        if (profile.max_line_investment >= 3000 && profile.other_lines_investment >= 1500) {
            userLevel = 'BUSHO';  // 武将の条件を満たす
        } else if (profile.max_line_investment >= 1000 && profile.other_lines_investment >= 0) {
            userLevel = 'ASHIGARU';  // 足軽の条件を満たす
        }

        console.log('計算されたユーザーレベル:', userLevel);

        // レベルがNONEの場合、天下統一ボーナスは0
        const conquestBonus = userLevel === 'NONE' ? 0 : await calculateConquestBonus(userId, userLevel);

        // 日次報酬の計算
        const totalDailyReward = await calculateDailyReward(userId);

        const result = {
            daily: totalDailyReward,
            conquest: conquestBonus,
            total: totalDailyReward + conquestBonus
        };

        console.log('最終報酬計算結果:', result);

        return result;

    } catch (error) {
        console.error('報酬計算エラー:', error);
        return {
            daily: 0,
            conquest: 0,
            total: 0
        };
    }
};

// 天下統一ボーナスを計算する関数を追加
const calculateConquestBonus = async (userId: string, userLevel: string): Promise<number> => {
    try {
        // 最新の週次利益を取得
        const { data: weeklyProfit, error: weeklyError } = await supabase
            .from('weekly_profits')
            .select('total_profit, distribution_amount, distributions')
            .order('week_end', { ascending: false })
            .limit(1)
            .single();

        console.log('週次利益データ:', {
            weeklyProfit,
            weeklyError,
            userId,
            userLevel
        });

        if (!weeklyProfit || !weeklyProfit.distributions) {
            console.log('週次利益データなし');
            return 0;
        }

        // ユーザーレベルの分配データを探す
        const levelDistribution = weeklyProfit.distributions.find(
            d => d.level === userLevel.toUpperCase()
        );

        console.log('レベル分配データ:', {
            userLevel: userLevel.toUpperCase(),
            distribution: levelDistribution,
            allDistributions: weeklyProfit.distributions
        });

        if (!levelDistribution) {
            console.log('該当レベルの分配データなし:', userLevel);
            return 0;
        }

        // ユーザーが該当レベルの分配対象者リストに含まれているか確認
        const isUserIncluded = levelDistribution.users.some(u => u.id === userId);
        
        console.log('ユーザー分配確認:', {
            userId,
            isIncluded: isUserIncluded,
            perUserAmount: levelDistribution.perUser,
            users: levelDistribution.users
        });

        // 該当ユーザーへの分配額を返す
        const bonus = isUserIncluded ? Number(levelDistribution.perUser.toFixed(2)) : 0;
        console.log('最終ボーナス額:', bonus);

        return bonus;

    } catch (error) {
        console.error('天下統一ボーナス計算エラー:', error);
        console.error('エラー詳細:', {
            error,
            userId,
            userLevel
        });
        return 0;
    }
};

// 日次報酬を計算する関数を追加
const calculateDailyReward = async (userId: string): Promise<number> => {
    try {
        // 承認済みNFTを取得
        const { data: nfts } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                nft_master!inner (
                    id,
                    price,
                    daily_rate
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (!nfts?.length) return 0;

        // 各NFTの日次報酬を計算
        let totalReward = 0;
        for (const nft of nfts) {
            const { data: rates } = await supabase
                .from('daily_rates')
                .select('rate')
                .eq('nft_id', nft.nft_master.id)
                .gte('date', '2025-02-10')
                .lte('date', '2025-02-14');

            if (!rates?.length) continue;

            // 日次報酬を合算
            const nftReward = rates.reduce((sum, { rate }) => {
                return sum + (nft.nft_master.price * Number(rate));
            }, 0);

            totalReward += nftReward;
        }

        return Number(totalReward.toFixed(2));
    } catch (error) {
        console.error('日次報酬計算エラー:', error);
        return 0;
    }
}; 