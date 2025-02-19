import type { UserLevelParams } from '@/app/types/user';

/**
 * ユーザーのレベルを計算する関数
 */
export function calculateUserLevel(params: UserLevelParams): string {
    const { personalInvestment, maxLine, otherLines } = params;

    // 足軽の条件
    if (personalInvestment >= 1000) {
        // 将軍の条件
        if (maxLine >= 600000 && otherLines >= 500000) {
            return '将軍';
        }
        // 大名の条件
        if (maxLine >= 300000 && otherLines >= 150000) {
            return '大名';
        }
        // 大老の条件
        if (maxLine >= 100000 && otherLines >= 50000) {
            return '大老';
        }
        // 老中の条件
        if (maxLine >= 50000 && otherLines >= 25000) {
            return '老中';
        }
        // 奉行の条件
        if (maxLine >= 10000 && otherLines >= 5000) {
            return '奉行';
        }
        // 代官の条件
        if (maxLine >= 5000 && otherLines >= 2500) {
            return '代官';
        }
        // 武将の条件
        if (maxLine >= 3000 && otherLines >= 1500) {
            return '武将';
        }
        // 足軽の基本条件のみ満たす場合
        return '足軽';
    }

    // どの条件も満たさない場合
    return '--';
} 