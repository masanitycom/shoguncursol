import { supabase } from '@/lib/supabase'
import { PendingRewards } from '@/types/reward'
import { calculateNFTReward } from '@/lib/services/nft'
import { calculateUserLevel } from '@/lib/utils/userLevel'
import { LEVEL_REQUIREMENTS } from '@/lib/constants/levels'

export const fetchPendingRewards = async (userId: string): Promise<PendingRewards> => {
    try {
        // プロフィール情報を取得
        const { data: profile } = await supabase
            .from('profiles')  // usersではなくprofilesテーブルを使用
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) {
            throw new Error('Profile not found');
        }

        // NFTから日次報酬を計算
        const { data: nfts, error: nftError } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                nft_settings (
                    id,
                    price,
                    daily_rate
                ),
                approved_at,
                created_at
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (nftError) throw nftError;

        // 日次報酬の計算
        let dailyTotal = 0;
        for (const nft of nfts || []) {
            const reward = await calculateNFTReward({
                nftId: nft.nft_settings.id,
                price: nft.nft_settings.price,
                defaultDailyRate: nft.nft_settings.daily_rate,
                purchaseDate: nft.approved_at,
                operationStartDate: new Date(nft.approved_at),
                targetStart: new Date('2025-02-10'),
                targetEnd: new Date('2025-02-14')
            });
            dailyTotal += reward.totalReward;
        }

        // 天下統一ボーナスの計算
        let conquestBonus = 0;
        const { data: weeklyProfits } = await supabase
            .from('weekly_profits')
            .select('*')
            .lte('payment_date', new Date().toISOString().split('T')[0])
            .order('payment_date', { ascending: false })
            .limit(1);

        if (weeklyProfits?.[0]) {
            const weeklyProfit = weeklyProfits[0];
            
            // レベル要件の確認
            const investmentInfo = {
                investment_amount: profile.investment_amount || 0,
                max_line_investment: profile.max_line_investment || 0,
                other_lines_investment: profile.other_lines_investment || 0
            };

            // 足軽以上のレベル要件を満たしているか確認
            const isEligible = 
                investmentInfo.max_line_investment >= 3000 &&  // 足軽の要件：最大系列3000ドル以上
                investmentInfo.other_lines_investment >= 1500; // 足軽の要件：他系列1500ドル以上

            if (isEligible) {
                conquestBonus = weeklyProfit.distribution_amount;
            }

            console.log('Weekly profit calculation:', {
                weekId: weeklyProfit.id,
                totalProfit: weeklyProfit.total_profit,
                distributionAmount: weeklyProfit.distribution_amount,
                weekStart: weeklyProfit.week_start,
                weekEnd: weeklyProfit.week_end,
                investmentInfo,
                isEligible,
                conquestBonus
            });
        }

        return {
            daily: dailyTotal,
            conquest: conquestBonus,
            total: dailyTotal + conquestBonus
        };
    } catch (error) {
        console.error('Error fetching pending rewards:', error);
        return { daily: 0, conquest: 0, total: 0 };
    }
}; 