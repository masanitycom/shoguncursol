import { supabase } from '@/lib/supabase';
import { LEVELS, LEVEL_REQUIREMENTS, type LevelRequirements, type LevelRequirement, type LevelKey } from '@/lib/constants/levels';
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

// プロファイルの型定義
interface Profile {
    id: string;
    email: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    level: string;
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

interface UserInvestment {
    readonly nftAmount: number;              // SHOGUN NFT保有額
    readonly maxLineInvestment: number;      // 最大系列の投資額
    readonly otherLinesInvestment: number;   // 他系列の投資額
}

export const calculateUserLevel = (investment: UserInvestment): LevelKey | 'NONE' => {
    console.log('レベル判定入力:', {
        nftAmount: investment.nftAmount,
        maxLine: investment.maxLineInvestment,
        otherLines: investment.otherLinesInvestment
    });

    // SHOGUN NFT 1000未満の場合はNONE
    if (investment.nftAmount < LEVEL_REQUIREMENTS.ASHIGARU.minNFT) {
        console.log('NFT条件未達：', investment.nftAmount);
        return 'NONE';
    }

    // 低いレベルから順に判定（ASHIGARUから）
    const levels = Object.entries(LEVEL_REQUIREMENTS) as [LevelKey, LevelRequirement][];
    
    for (const [level, requirements] of levels) {
        const isLevelAchieved = 
            investment.maxLineInvestment >= requirements.maxLine &&
            investment.otherLinesInvestment >= requirements.otherLines;

        console.log(`${level}レベル判定:`, {
            required: {
                maxLine: requirements.maxLine,
                otherLines: requirements.otherLines
            },
            actual: {
                maxLine: investment.maxLineInvestment,
                otherLines: investment.otherLinesInvestment
            },
            achieved: isLevelAchieved
        });

        if (isLevelAchieved) {
            return level;
        }
    }

    return 'NONE';
}; 