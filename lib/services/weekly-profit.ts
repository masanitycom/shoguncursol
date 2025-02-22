import { supabase } from '@/lib/supabase';
import { WeeklyProfitPreview } from '@/types/reward';

// レベルの表示順を定義
export const LEVEL_ORDER = [
    'SHOGUN',   // 将軍
    'DAIMYO',   // 大名
    'TAIRO',    // 大老
    'ROJU',     // 老中
    'BUGYO',    // 奉行
    'DAIKANN',  // 代官
    'BUSHO',    // 武将
    'ASHIGARU'  // 足軽
] as const;

// レベル要件の定義
export const LEVEL_REQUIREMENTS = {
    'SHOGUN': {
        maxLine: 600000,
        otherLines: 500000
    },
    'DAIMYO': {
        maxLine: 300000,
        otherLines: 150000
    },
    'TAIRO': {
        maxLine: 100000,
        otherLines: 50000
    },
    'ROJU': {
        maxLine: 50000,
        otherLines: 25000
    },
    'BUGYO': {
        maxLine: 10000,
        otherLines: 5000
    },
    'DAIKANN': {
        maxLine: 5000,
        otherLines: 2500
    },
    'BUSHO': {
        maxLine: 3000,
        otherLines: 1500
    },
    'ASHIGARU': {
        maxLine: 1000,
        otherLines: 0
    }
} as const;

// 天下統一ボーナスの分配率
export const CONQUEST_BONUS_RATES = {
    'ASHIGARU': 45,  // 足軽: 45%
    'BUSHO': 25,     // 武将: 25%
    'DAIKANN': 10,   // 代官: 10%
    'BUGYO': 6,      // 奉行: 6%
    'ROJU': 5,       // 老中: 5%
    'TAIRO': 4,      // 大老: 4%
    'DAIMYO': 3,     // 大名: 3%
    'SHOGUN': 2      // 将軍: 2%
} as const;

// レベルの日本語表示を追加
export const LEVEL_NAMES = {
    'SHOGUN': '将軍',
    'DAIMYO': '大名',
    'TAIRO': '大老',
    'ROJU': '老中',
    'BUGYO': '奉行',
    'DAIKANN': '代官',
    'BUSHO': '武将',
    'ASHIGARU': '足軽'
} as const;

export const calculateWeeklyProfitPreview = async (
    startDate: Date,
    endDate: Date,
    companyProfit: number,
    distributionRate: number
): Promise<WeeklyProfitPreview> => {
    try {
        // ユーザーデータの取得
        const { data: users, error } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                name,
                max_line_investment,
                other_lines_investment,
                nft_purchase_requests (
                    id,
                    status,
                    nft_settings (
                        price
                    )
                )
            `)

        if (error) throw error

        // 総分配額の計算
        const totalDistribution = companyProfit * (distributionRate / 100)

        // レベルごとのユーザー集計
        const levelUsers = {} as Record<string, Array<{ id: string, display_id: string, name: string }>>
        
        users?.forEach(user => {
            const hasRequiredNFT = user.nft_purchase_requests?.some(nft => 
                nft.status === 'approved' && 
                nft.nft_settings?.price >= 1000
            )

            if (hasRequiredNFT) {
                const maxLine = Number(user.max_line_investment) || 0
                const otherLines = Number(user.other_lines_investment) || 0

                // 最上位のレベルから判定
                let assigned = false
                for (const [level, req] of Object.entries(LEVEL_REQUIREMENTS)) {
                    if (!assigned && maxLine >= req.maxLine && otherLines >= req.otherLines) {
                        if (!levelUsers[level]) {
                            levelUsers[level] = []
                        }
                        levelUsers[level].push({
                            id: user.id,
                            display_id: user.display_id,
                            name: user.name
                        })
                        assigned = true
                    }
                }
            }
        })

        // レベルごとの分配額を計算
        const distributions = LEVEL_ORDER.map(level => {
            const users = levelUsers[level] || []
            const rate = CONQUEST_BONUS_RATES[level]
            const levelAmount = users.length > 0 ? totalDistribution * (rate / 100) : 0  // ユーザーがいない場合は0
            const perUser = users.length > 0 ? levelAmount / users.length : 0

            return {
                level,
                userCount: users.length,
                amount: levelAmount,  // ユーザーがいるレベルの分のみ計算
                perUser,
                users
            }
        })

        // 実際の総分配額を計算（ユーザーがいるレベルの合計）
        const actualTotalDistribution = distributions.reduce((total, level) => total + level.amount, 0)

        return {
            weekStartDate: startDate,
            weekEndDate: endDate,
            companyProfit,
            distributionRate,
            distributions: {
                unificationBonus: {
                    total: actualTotalDistribution,  // 実際の総分配額を使用
                    byLevel: distributions
                }
            },
            totalDistribution: actualTotalDistribution
        }
    } catch (error) {
        console.error('Error calculating preview:', error)
        throw error
    }
}

const getNextMondayDate = (date: Date): Date => {
    const nextMonday = new Date(date);
    nextMonday.setDate(nextMonday.getDate() + (7 - nextMonday.getDay()) + 1);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
};

export const registerWeeklyProfit = async (data: WeeklyProfitPreview) => {
    try {
        const paymentDate = getNextMondayDate(new Date(data.weekEndDate));
        
        const { error } = await supabase
            .from('weekly_profits')
            .insert({
                week_start: data.weekStartDate,
                week_end: data.weekEndDate,
                total_profit: data.companyProfit,
                share_rate: data.distributionRate,
                distribution_amount: data.distributions.unificationBonus.total,
                payment_date: paymentDate,
                distributions: data.distributions.unificationBonus.byLevel
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error registering weekly profit:', error);
        throw error;
    }
}; 