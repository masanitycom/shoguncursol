import { supabase } from '@/lib/supabase';
import { WeeklyProfitPreview } from '@/types/reward';

// 天下統一ボーナスの分配率
const CONQUEST_BONUS_RATES = {
    'ASHIGARU': 45,  // 足軽: 45%
    'BUSHO': 25,     // 武将: 25%
    'DAIKANN': 10,   // 代官: 10%
    'BUGYO': 6,      // 奉行: 6%
    'ROJU': 5,       // 老中: 5%
    'TAIRO': 4,      // 大老: 4%
    'DAIMYO': 3,     // 大名: 3%
    'SHOGUN': 2      // 将軍: 2%
} as const;

export async function calculateWeeklyProfitPreview(
    startDate: Date,
    endDate: Date,
    companyProfit: number,
    distributionRate: number
): Promise<WeeklyProfitPreview> {
    try {
        console.log('プレビュー計算開始:', { companyProfit, distributionRate });

        // レベルごとのユーザー数を取得
        const { data: users, error } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                nft_purchase_requests (
                    id,
                    status,
                    nft_settings (
                        price
                    )
                ),
                investment_amount,
                max_line_investment,
                other_lines_investment
            `);  // NONEの条件を削除

        if (error) {
            console.error('ユーザー取得エラー:', error);
            throw error;
        }

        console.log('取得したユーザー:', users);

        // レベルごとのユーザー情報を集計
        const levelUsers = users.reduce((acc, user) => {
            // NFTの確認
            const hasRequiredNFT = user.nft_purchase_requests?.some(nft => 
                nft.status === 'approved' && 
                Number(nft.nft_settings.price) >= 1000
            );

            // レベル判定
            let level = 'NONE';
            const maxLine = Number(user.max_line_investment) || 0;
            const otherLines = Number(user.other_lines_investment) || 0;

            if (hasRequiredNFT && maxLine >= 1000) {
                if (maxLine >= 600000 && otherLines >= 500000) level = 'SHOGUN';
                else if (maxLine >= 300000 && otherLines >= 150000) level = 'DAIMYO';
                else if (maxLine >= 100000 && otherLines >= 50000) level = 'TAIRO';
                else if (maxLine >= 50000 && otherLines >= 25000) level = 'ROJU';
                else if (maxLine >= 10000 && otherLines >= 5000) level = 'BUGYO';
                else if (maxLine >= 5000 && otherLines >= 2500) level = 'DAIKANN';
                else if (maxLine >= 3000 && otherLines >= 1500) level = 'BUSHO';
                else level = 'ASHIGARU';
            }

            if (level !== 'NONE') {
                if (!acc[level]) {
                    acc[level] = [];
                }
                acc[level].push({
                    id: user.id,
                    display_id: user.display_id
                });
            }
            return acc;
        }, {} as Record<string, Array<{ id: string, display_id: string }>>);

        console.log('レベルごとのユーザー:', levelUsers);

        // レベルごとのユーザー数を集計
        const levelCounts = Object.entries(levelUsers).reduce((acc, [level, users]) => {
            acc[level] = users.length;
            return acc;
        }, {} as Record<string, number>);

        // 分配原資の計算
        const totalBonus = companyProfit * (distributionRate / 100);

        // レベルごとのポイント計算
        const totalPoints = Object.entries(levelCounts).reduce((sum, [level, count]) => 
            sum + (CONQUEST_BONUS_RATES[level] || 0) * count, 0);

        // レベルごとの分配額を計算
        const byLevel = Object.entries(levelCounts)
            .filter(([level]) => level in CONQUEST_BONUS_RATES)
            .map(([level, userCount]) => {
                const levelPoints = CONQUEST_BONUS_RATES[level] * userCount;
                const amount = (totalBonus * levelPoints) / totalPoints;
                return {
                    level,
                    userCount,
                    amount,
                    perUser: amount / userCount,
                    users: levelUsers[level] || []
                };
            });

        return {
            weekStartDate: startDate,
            weekEndDate: endDate,
            companyProfit,
            distributionRate,
            distributions: {
                dailyRewards: {
                    total: 0,
                    details: []
                },
                unificationBonus: {
                    total: totalBonus,
                    byLevel
                }
            },
            totalDistribution: totalBonus
        };
    } catch (error) {
        console.error('Error calculating preview:', error);
        throw error;
    }
} 