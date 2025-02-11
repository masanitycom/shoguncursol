import type { LevelStats, UserLevelParams } from '@/app/types/user';

/**
 * ユーザーのレベルを計算する関数
 */
export function calculateUserLevel(params: UserLevelParams): string {
    const { personalInvestment, maxLine, otherLines } = params;

    // 個人の投資額が1000ドル未満の場合
    if (personalInvestment < 1000) return '--';

    // レベル判定ロジック
    if (maxLine >= 600000 && otherLines >= 500000) return '将軍';
    if (maxLine >= 300000 && otherLines >= 150000) return '大名';
    if (maxLine >= 100000 && otherLines >= 50000) return '大老';
    if (maxLine >= 50000 && otherLines >= 25000) return '老中';
    if (maxLine >= 10000 && otherLines >= 5000) return '奉行';
    if (maxLine >= 5000 && otherLines >= 2500) return '代官';
    if (maxLine >= 3000 && otherLines >= 1500) return '武将';
    if (maxLine >= 1000) return '足軽';

    return '--';
} 