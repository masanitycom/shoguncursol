import { supabase } from '@/lib/supabase';
import { LEVELS, LEVEL_REQUIREMENTS } from '@/lib/constants/levels';
import type { LevelStats, UserLevelParams } from '@/types/user';

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
    nft_settings: NFTSettings;
}

// 戻り値の型を定義
export interface UserLevelResult {
    level: string;
    stats: {
        personalInvestment: number;
        maxLine: number;
        otherLines: number;
        totalInvestment: number;
    };
}

/**
 * ユーザーのレベルを計算する関数
 */
export function calculateUserStats(params: UserLevelParams): LevelStats {
    const { personalInvestment, maxLine, otherLines } = params;

    // 数値型であることを確認
    if (
        typeof personalInvestment !== 'number' ||
        typeof maxLine !== 'number' ||
        typeof otherLines !== 'number'
    ) {
        throw new Error('Invalid parameter types: all parameters must be numbers');
    }

    // 初期値を設定
    const stats: LevelStats = {
        personalInvestment,
        maxLine,
        otherLines,
        teamInvestment: maxLine + otherLines,
        totalInvestment: personalInvestment + maxLine + otherLines,
        referralCount: 0,
        currentLevel: '--'
    };

    // レベル判定
    for (const level of LEVEL_REQUIREMENTS) {
        if (
            personalInvestment >= level.requiredNFT &&
            maxLine >= level.maxLine &&
            otherLines >= level.otherLines
        ) {
            stats.currentLevel = level.name;
            break;
        }
    }

    return stats;
}

// ユーザーレベルを計算
export const calculateUserLevel = async (userId: string): Promise<UserLevelResult> => {
    try {
        // ユーザーの投資情報を取得
        const { data: userData, error } = await supabase
            .from('users')
            .select('investment_amount, max_line_investment, other_lines_investment')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const stats = calculateUserStats({
            personalInvestment: Number(userData.investment_amount) || 0,
            maxLine: Number(userData.max_line_investment) || 0,
            otherLines: Number(userData.other_lines_investment) || 0
        });

        return {
            level: stats.currentLevel || '--',
            stats: {
                personalInvestment: stats.personalInvestment,
                maxLine: stats.maxLine,
                otherLines: stats.otherLines,
                totalInvestment: stats.totalInvestment || 0
            }
        };
    } catch (error) {
        console.error('Error in calculateUserLevel:', error);
        throw error;
    }
}; 