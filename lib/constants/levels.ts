export interface LevelRequirement {
    readonly maxLine: number;      // 最大系列投資額
    readonly otherLines: number;   // 他系列投資額
    readonly shareRate: number;    // 分配率
    readonly minNFT: number;       // SHOGUN NFT最低保有額
}

export const LEVEL_ORDER = ['足軽', '武将', '代官', '奉行', '老中', '大老', '大名', '将軍'] as const;

export const LEVEL_NAMES_JP = {
    none: '未達成',
    ashigaru: '足軽',
    busho: '武将',
    daikan: '代官',
    bugyo: '奉行',
    roju: '老中',
    tairo: '大老',
    daimyo: '大名',
    shogun: '将軍'
} as const;

// レベル要件を定数として定義
const LEVEL_REQUIREMENTS_CONST = {
    SHOGUN: {
        maxLine: 600000,      // 最大系列600,000ドル以上
        otherLines: 500000,   // 他系列合計500,000ドル以上
        shareRate: 2,         // 分配率2%
        minNFT: 1000         // SHOGUN NFT最低保有額
    },
    DAIMYO: {
        maxLine: 300000,
        otherLines: 150000,
        shareRate: 3,
        minNFT: 1000
    },
    TAIRO: {
        maxLine: 100000,
        otherLines: 50000,
        shareRate: 4,
        minNFT: 1000
    },
    ROJU: {
        maxLine: 50000,
        otherLines: 25000,
        shareRate: 5,
        minNFT: 1000
    },
    BUGYO: {
        maxLine: 10000,
        otherLines: 5000,
        shareRate: 6,
        minNFT: 1000
    },
    DAIKAN: {
        maxLine: 5000,
        otherLines: 2500,
        shareRate: 10,
        minNFT: 1000
    },
    BUSHO: {
        maxLine: 3000,
        otherLines: 1500,
        shareRate: 8,
        minNFT: 1000
    },
    ASHIGARU: {
        maxLine: 1000,
        otherLines: 0,
        shareRate: 5,
        minNFT: 1000
    }
} as const;

// レベル要件をDeepReadonlyで保護
export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// レベル要件をエクスポート（完全な読み取り専用）
export const LEVEL_REQUIREMENTS: DeepReadonly<typeof LEVEL_REQUIREMENTS_CONST> = 
    Object.freeze(LEVEL_REQUIREMENTS_CONST);

// レベル要件の型をエクスポート
export type LevelRequirements = typeof LEVEL_REQUIREMENTS;

// レベルキーの型定義
export type LevelKey = keyof typeof LEVEL_REQUIREMENTS;

// レベル情報の型定義
export type LevelInfo = {
    maxLine: number;
    otherLines: number;
    shareRate: number;
};

// レベルの配列を作成（map関数を使用しない方法）
export const LEVELS = Object.entries(LEVEL_REQUIREMENTS).map(([key, value]) => ({
    name: LEVEL_NAMES_JP[key.toLowerCase() as keyof typeof LEVEL_NAMES_JP],
    shareRate: value.shareRate
}));

// 天下統一ボーナスの分配率を定義
export const CONQUEST_BONUS_RATES = {
    'ASHIGARU': 45,  // 足軽: 45%
    'BUSHO': 25,     // 武将: 25%
    'DAIKAN': 10,    // 代官: 10%
    'BUGYO': 6,      // 奉行: 6%
    'ROJU': 5,       // 老中: 5%
    'TAIRO': 4,      // 大老: 4%
    'DAIMYO': 3,     // 大名: 3%
    'SHOGUN': 2      // 将軍: 2%
} as const; 