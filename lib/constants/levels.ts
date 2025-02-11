export const LEVELS = [
    {
        name: 'SHOGUN',
        requirements: {
            nftAmount: 100000,  // 個人投資額
            maxLine: 600000,    // 最大系列
            otherLines: 500000  // 他系列
        },
        shareRate: 45  // 報酬シェア率（%）
    },
    {
        name: 'DAIMYO',
        requirements: {
            nftAmount: 30000,
            maxLine: 300000,
            otherLines: 150000
        },
        shareRate: 25
    },
    {
        name: 'SAMURAI',
        requirements: {
            nftAmount: 8000,
            maxLine: 100000,
            otherLines: 50000
        },
        shareRate: 15
    },
    {
        name: 'ASHIGARU',
        requirements: {
            nftAmount: 3000,
            maxLine: 30000,
            otherLines: 15000
        },
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

export const LEVEL_REQUIREMENTS = {
    // 将軍: SHOGUN NFT1000必須、最大系列600,000以上、他系列合計500,000以上
    shogun: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 600000, 
        otherLines: 500000 
    },
    // 大名: SHOGUN NFT1000必須、最大系列300,000以上、他系列合計150,000以上
    daimyo: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 300000, 
        otherLines: 150000 
    },
    // 大老: SHOGUN NFT1000必須、最大系列100,000以上、他系列合計50,000以上
    tairo: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 100000, 
        otherLines: 50000 
    },
    // 老中: SHOGUN NFT1000必須、最大系列50,000以上、他系列合計25,000以上
    roju: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 50000, 
        otherLines: 25000 
    },
    // 奉行: SHOGUN NFT1000必須、最大系列10,000以上、他系列合計5,000以上
    bugyo: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 10000, 
        otherLines: 5000 
    },
    // 代官: SHOGUN NFT1000必須、最大系列5,000以上、他系列合計2,500以上
    daikan: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 5000, 
        otherLines: 2500 
    },
    // 武将: SHOGUN NFT1000必須、最大系列3,000以上、他系列合計1,500以上
    busho: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 3000, 
        otherLines: 1500 
    },
    // 足軽: SHOGUN NFT1000必須
    ashigaru: { 
        requiredNFT: 'SHOGUN NFT1000',
        maxLine: 0, 
        otherLines: 0 
    }
};

export interface LevelRequirement {
    requiredNFT: string;
    maxLine: number;
    otherLines: number;
} 