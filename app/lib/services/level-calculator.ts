// レベル要件の型定義
interface LevelRequirement {
    level: number;
    points: number;
    requiredNFTs: string[];
    maxLine: number;
    otherLines: number;
}

// レベル要件の定義を配列形式に変更
export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
    {
        level: 1,
        points: 0,
        requiredNFTs: [],
        maxLine: 0,
        otherLines: 0
    },
    {
        level: 2,
        points: 100,
        requiredNFTs: ['basic_nft'],
        maxLine: 100,
        otherLines: 50
    },
    {
        level: 3,
        points: 300,
        requiredNFTs: ['premium_nft'],
        maxLine: 200,
        otherLines: 100
    }
];

export class LevelCalculator {
    static async getUserNFTs(userId: string): Promise<string[]> {
        // ここでユーザーのNFTを取得するロジックを実装
        // 例: データベースからユーザーのNFTを取得
        return []; // 仮の実装
    }

    static calculateLevel(points: number): number {
        const level = LEVEL_REQUIREMENTS.findIndex(req => points < req.points);
        return level === -1 ? LEVEL_REQUIREMENTS.length : level;
    }

    static async checkRequiredNFT(userId: string, level: number): Promise<boolean> {
        const userNFTs = await this.getUserNFTs(userId);
        const requirement = LEVEL_REQUIREMENTS.find(req => req.level === level);
        if (!requirement) return false;
        return requirement.requiredNFTs.every(nft => userNFTs.includes(nft));
    }

    static async calculateLines(userId: string): Promise<{maxLine: number, otherLines: number}> {
        // ユーザーのコードを取得するロジックを実装
        const code = ''; // 仮の実装
        const lines = code.split('\n').filter(line => line.trim().length > 0).length;
        return {
            maxLine: lines,
            otherLines: 0 // 仮の実装
        };
    }

    static async calculateUserLevel(userId: string): Promise<number> {
        const userNFTs = await this.getUserNFTs(userId);
        const points = 0; // ポイントを取得するロジックを実装
        const baseLevel = this.calculateLevel(points);
        
        // NFT要件を満たしているか確認
        for (let level = baseLevel; level > 1; level--) {
            if (await this.checkRequiredNFT(userId, level)) {
                return level;
            }
        }
        return 1; // デフォルトレベル
    }
} 