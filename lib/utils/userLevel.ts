import { supabase } from '@/lib/supabase';
import { LEVELS } from '@/lib/constants/levels';

// NFTの設定情報の型
interface NFTSettings {
    price: number;
    daily_rate: number;
    name: string;
}

// NFT購入リクエストの型
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_settings: NFTSettings;  // 単一のオブジェクト
}

// 戻り値の型を定義
interface UserStats {
    personalInvestment: number;
    maxLine: number;
    otherLines: number;
    totalInvestment: number;
}

// ユーザーの統計情報を計算
export const calculateUserStats = async (userId: string): Promise<UserStats> => {
    try {
        // NFTデータを取得
        const { data: nftData, error: nftError } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                user_id,
                nft_settings:nft_settings_id!inner (
                    price,
                    daily_rate,
                    name
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (nftError) {
            console.error('Error fetching NFTs for user:', userId, nftError);
            throw nftError;
        }

        // デバッグ: NFTデータの確認
        console.log('NFT data for user:', userId, JSON.stringify(nftData, null, 2));

        // 投資額の計算（型アサーションを避けて直接計算）
        const personalInvestment = (nftData || []).reduce((sum, item: any) => {
            const price = Number(item.nft_settings?.price || 0);
            if (isNaN(price)) {
                console.log('Invalid price for NFT:', item);
                return sum;
            }
            return sum + price;
        }, 0);

        console.log('Calculated personal investment:', personalInvestment);

        // 2. 紹介ネットワークを取得
        const { data: referrals, error: referralsError } = await supabase
            .from('users')
            .select('id, investment_amount')
            .eq('referrer_id', userId);

        if (referralsError) {
            console.error('Error fetching referrals:', referralsError);
            throw referralsError;
        }

        console.log('Referrals for', userId, ':', referrals);

        // 3. 各系列の投資額を計算
        const lineInvestments = await Promise.all(
            referrals?.map(async (referral) => {
                const stats = await calculateUserStats(referral.id);
                return {
                    id: referral.id,
                    investment: Number(referral.investment_amount) + (stats.totalInvestment || 0)
                };
            }) || []
        );

        // 4. 最大系列と他系列を計算
        const sortedLines = lineInvestments.sort((a, b) => b.investment - a.investment);
        const maxLine = sortedLines[0]?.investment || 0;
        const otherLines = sortedLines.slice(1).reduce((sum, line) => sum + line.investment, 0);

        const totalInvestment = personalInvestment + maxLine + otherLines;

        return {
            personalInvestment,
            maxLine,
            otherLines,
            totalInvestment
        };

    } catch (error) {
        console.error('Error calculating stats for user:', userId, error);
        throw error;
    }
};

// ユーザーレベルを計算
export const calculateUserLevel = async (userId: string): Promise<{
    level: string;
    stats: UserStats;
}> => {
    try {
        const stats = await calculateUserStats(userId);
        
        // デバッグ用
        console.log('Raw stats:', {
            userId,
            stats
        });

        // 型チェック
        if (typeof stats.personalInvestment !== 'number') {
            console.error('Invalid personalInvestment:', stats.personalInvestment);
            throw new Error('Invalid personal investment value');
        }

        // レベル判定（上位から判定）
        for (const level of LEVELS) {
            const meetsPersonalInvestment = stats.personalInvestment >= level.requirements.nftAmount;
            const meetsMaxLine = stats.maxLine >= level.requirements.maxLine;
            const meetsOtherLines = stats.otherLines >= level.requirements.otherLines;

            console.log(`Checking ${level.name}:`, {
                meetsPersonalInvestment,
                meetsMaxLine,
                meetsOtherLines,
                stats,
                required: level.requirements
            });

            if (meetsPersonalInvestment && meetsMaxLine && meetsOtherLines) {
                return {
                    level: level.name,
                    stats
                };
            }
        }

        // 最低レベル（足軽）の条件
        if (stats.personalInvestment >= 1000) {
            return {
                level: 'ASHIGARU',
                stats: {
                    personalInvestment: stats.personalInvestment,
                    maxLine: 0,
                    otherLines: 0,
                    totalInvestment: stats.personalInvestment
                }
            };
        }

        // デフォルトレベル
        return {
            level: '--',
            stats: {
                personalInvestment: stats.personalInvestment,
                maxLine: 0,
                otherLines: 0,
                totalInvestment: stats.personalInvestment
            }
        };

    } catch (error) {
        console.error('Error in calculateUserLevel:', error);
        throw error;
    }
}; 