import type { LevelStats, UserLevelParams } from '@/app/types/user';

/**
 * ユーザーのレベルを計算する関数
 */
export function calculateUserLevel(params: UserLevelParams): LevelStats {
    const { personalInvestment, maxLine, otherLines } = params;

    // 初期値を設定
    const result: LevelStats = {
        totalInvestment: personalInvestment + maxLine + otherLines,
        referralCount: 0,
        currentLevel: '--',
        nextLevel: null,
        progressToNext: 0
    };

    // レベル判定ロジック
    if (maxLine >= 600000 && otherLines >= 500000) {
        result.currentLevel = '将軍';
    } else if (maxLine >= 300000 && otherLines >= 150000) {
        result.currentLevel = '大名';
        result.nextLevel = '将軍';
        result.progressToNext = ((maxLine - 300000) / (600000 - 300000)) * 100;
    } else if (maxLine >= 100000 && otherLines >= 50000) {
        result.currentLevel = '大老';
        result.nextLevel = '大名';
        result.progressToNext = ((maxLine - 100000) / (300000 - 100000)) * 100;
    } else if (maxLine >= 50000 && otherLines >= 25000) {
        result.currentLevel = '老中';
        result.nextLevel = '大老';
        result.progressToNext = ((maxLine - 50000) / (100000 - 50000)) * 100;
    } else if (maxLine >= 10000 && otherLines >= 5000) {
        result.currentLevel = '奉行';
        result.nextLevel = '老中';
        result.progressToNext = ((maxLine - 10000) / (50000 - 10000)) * 100;
    } else if (maxLine >= 5000 && otherLines >= 2500) {
        result.currentLevel = '代官';
        result.nextLevel = '奉行';
        result.progressToNext = ((maxLine - 5000) / (10000 - 5000)) * 100;
    } else if (maxLine >= 3000 && otherLines >= 1500) {
        result.currentLevel = '武将';
        result.nextLevel = '代官';
        result.progressToNext = ((maxLine - 3000) / (5000 - 3000)) * 100;
    } else if (maxLine >= 1000) {
        result.currentLevel = '足軽';
        result.nextLevel = '武将';
        result.progressToNext = ((maxLine - 1000) / (3000 - 1000)) * 100;
    }

    result.progressToNext = Math.min(Math.max(result.progressToNext, 0), 100);
    return result;
}

// 型のエクスポートを追加
export type { UserLevelParams, LevelStats }; 