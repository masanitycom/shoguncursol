import { supabase } from '../supabase';

export interface LevelRequirement {
    name: string;
    requiredNFT: number;
    maxLine: number;
    otherLines: number;
    shareRate: number;
}

// レベル要件の定義（昇順に並び替え）
export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
    {
        name: '足輕',
        requiredNFT: 1000,
        maxLine: 1000,
        otherLines: 0,
        shareRate: 45
    },
    {
        name: '武将',
        requiredNFT: 1000,
        maxLine: 3000,
        otherLines: 1500,
        shareRate: 25
    },
    {
        name: '代官',
        requiredNFT: 1000,
        maxLine: 5000,
        otherLines: 2500,
        shareRate: 10
    },
    {
        name: '奉行',
        requiredNFT: 1000,
        maxLine: 10000,
        otherLines: 5000,
        shareRate: 6
    },
    {
        name: '老中',
        requiredNFT: 1000,
        maxLine: 50000,
        otherLines: 25000,
        shareRate: 5
    },
    {
        name: '大老',
        requiredNFT: 1000,
        maxLine: 100000,
        otherLines: 50000,
        shareRate: 4
    },
    {
        name: '大名',
        requiredNFT: 1000,
        maxLine: 300000,
        otherLines: 150000,
        shareRate: 3
    },
    {
        name: '将軍',
        requiredNFT: 1000,
        maxLine: 600000,
        otherLines: 500000,
        shareRate: 2
    }
];

// 現在のエクスポート状態を確認
console.log('LEVEL_REQUIREMENTS:', LEVEL_REQUIREMENTS);

// テスト用のコードを追加
export const LEVEL_REQUIREMENTS_TEST = [
    {
        name: '足軽',
        maxLine: 1000,
        otherLines: 0
    },
    // ... 他のレベル
];

export class LevelCalculator {
    // NFT要件のチェック
    static async checkRequiredNFT(userId: string): Promise<boolean> {
        try {
            console.log('Checking NFT requirement for:', userId);

            const { data, error } = await supabase
                .from('user_data')
                .select('investment')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('NFTチェックエラー:', error);
                return false;
            }

            const investment = data?.investment || 0;
            console.log('Investment amount:', investment);

            return investment >= 1000;
        } catch (error) {
            console.error('NFTチェック処理エラー:', error);
            return false;
        }
    }

    // 系列の金額を計算
    static async calculateLines(userId: string) {
        try {
            console.log('Calculating lines for:', userId);

            const { data: referrals, error } = await supabase
                .from('user_data')
                .select('id, investment')
                .eq('referrer', userId);

            if (error) {
                console.error('系列計算エラー:', error);
                return { maxLine: 0, otherLines: 0 };
            }

            console.log('Found referrals:', referrals);

            const lines = referrals?.map(ref => ref.investment || 0) || [];
            const maxLine = lines.length > 0 ? Math.max(...lines) : 0;
            const otherLines = lines.reduce((sum, amount) => 
                sum + (amount === maxLine ? 0 : amount), 0
            );

            console.log('Line calculation result:', {
                userId,
                referrals: referrals?.map(r => ({ id: r.id, investment: r.investment })),
                maxLine,
                otherLines
            });

            return { maxLine, otherLines };
        } catch (error) {
            console.error('系列計算処理エラー:', error);
            return { maxLine: 0, otherLines: 0 };
        }
    }

    // レベルを判定（修正）
    static determineLevel(maxLine: number, otherLines: number): LevelRequirement | null {
        // 要件を満たす最高レベルを探す
        const level = LEVEL_REQUIREMENTS
            .filter(level => 
                maxLine >= level.maxLine && 
                otherLines >= level.otherLines
            )
            .reduce((highest, current) => {
                if (!highest) return current;
                if (current.maxLine > highest.maxLine) return current;
                if (current.maxLine === highest.maxLine && 
                    current.otherLines > highest.otherLines) return current;
                return highest;
            }, null as LevelRequirement | null);

        console.log('Level determination:', {
            maxLine,
            otherLines,
            determinedLevel: level?.name || 'none',
            requirements: LEVEL_REQUIREMENTS.map(l => ({
                name: l.name,
                maxLine: l.maxLine,
                otherLines: l.otherLines,
                meetsMaxLine: maxLine >= l.maxLine,
                meetsOtherLines: otherLines >= l.otherLines
            }))
        });

        return level;
    }

    // ユーザーの現在のレベルを計算
    static async calculateUserLevel(userId: string): Promise<string> {
        console.log('Calculating level for:', userId);

        const hasRequiredNFT = await this.checkRequiredNFT(userId);
        console.log('NFT requirement met:', hasRequiredNFT);

        if (!hasRequiredNFT) return 'none';

        const { maxLine, otherLines } = await this.calculateLines(userId);
        const level = this.determineLevel(maxLine, otherLines);
        return level?.name || 'none';
    }
} 