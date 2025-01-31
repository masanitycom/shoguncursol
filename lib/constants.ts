export const LEVEL_REQUIREMENTS = [
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
]

export interface LevelRequirement {
    name: string;
    requiredNFT: number;
    maxLine: number;
    otherLines: number;
    shareRate: number;
} 