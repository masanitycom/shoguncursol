export const LEVELS = [
    {
        id: 0,
        name: 'レベルなし',
        shareRate: 0,
        requirements: {
            nftAmount: 0,
            maxLine: 0,
            otherLines: 0
        }
    },
    {
        id: 1,
        name: '足輕',
        shareRate: 45,
        requirements: {
            nftAmount: 1000,
            maxLine: 1000,
            otherLines: 0
        }
    },
    {
        id: 2,
        name: '武将',
        shareRate: 25,
        requirements: {
            nftAmount: 1000,
            maxLine: 3000,
            otherLines: 1500
        }
    },
    {
        id: 3,
        name: '代官',
        shareRate: 10,
        requirements: {
            nftAmount: 1000,
            maxLine: 5000,
            otherLines: 2500
        }
    },
    {
        id: 4,
        name: '奉行',
        shareRate: 6,
        requirements: {
            nftAmount: 1000,
            maxLine: 10000,
            otherLines: 5000
        }
    },
    {
        id: 5,
        name: '老中',
        shareRate: 5,
        requirements: {
            nftAmount: 1000,
            maxLine: 50000,
            otherLines: 25000
        }
    },
    {
        id: 6,
        name: '大老',
        shareRate: 4,
        requirements: {
            nftAmount: 1000,
            maxLine: 100000,
            otherLines: 50000
        }
    },
    {
        id: 7,
        name: '大名',
        shareRate: 3,
        requirements: {
            nftAmount: 1000,
            maxLine: 300000,
            otherLines: 150000
        }
    },
    {
        id: 8,
        name: '将軍',
        shareRate: 2,
        requirements: {
            nftAmount: 1000,
            maxLine: 600000,
            otherLines: 500000
        }
    }
] as const

export type Level = typeof LEVELS[number]

export interface LevelRequirement {
    nftAmount: number
    maxLine: number
    otherLines: number
} 