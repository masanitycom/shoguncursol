export interface LevelRequirement {
    level: number;
    name: string;
    requiredNFT: number;
    maxLine: number;
    otherLines: number;
    shareRate: number;
}

export const LEVEL_ORDER = ['足軽', '武将', '代官', '奉行', '老中', '大老', '大名', '将軍'] as const;

export const LEVEL_REQUIREMENTS: LevelRequirement[] = [
    {
        level: 1,
        name: '足軽',
        requiredNFT: 1000,
        maxLine: 0,
        otherLines: 0,
        shareRate: 5
    },
    {
        level: 8,
        name: '将軍',
        requiredNFT: 1000,
        maxLine: 600000,
        otherLines: 500000,
        shareRate: 45
    },
    {
        level: 7,
        name: '大名',
        requiredNFT: 1000,
        maxLine: 300000,
        otherLines: 150000,
        shareRate: 35
    },
    {
        level: 6,
        name: '大老',
        requiredNFT: 1000,
        maxLine: 100000,
        otherLines: 50000,
        shareRate: 30
    },
    {
        level: 5,
        name: '老中',
        requiredNFT: 1000,
        maxLine: 50000,
        otherLines: 25000,
        shareRate: 25
    },
    {
        level: 4,
        name: '奉行',
        requiredNFT: 1000,
        maxLine: 10000,
        otherLines: 5000,
        shareRate: 20
    },
    {
        level: 3,
        name: '代官',
        requiredNFT: 1000,
        maxLine: 5000,
        otherLines: 2500,
        shareRate: 15
    },
    {
        level: 2,
        name: '武将',
        requiredNFT: 1000,
        maxLine: 3000,
        otherLines: 1500,
        shareRate: 10
    }
];

export type Level = {
    name: string;
    requirements: {
        nftAmount: number;
        maxLine: number;
        otherLines: number;
    };
    shareRate: number;
};

// LEVEL_REQUIREMENTSから名前と共有率のみを抽出したLEVELSを作成
export const LEVELS = LEVEL_REQUIREMENTS.map(({ name, shareRate }) => ({
    name,
    shareRate
})); 