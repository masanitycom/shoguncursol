export type UserLevel = 'none' | 'ashigaru' | 'busho' | 'daikan' | 'bugyo' | 'roju' | 'tairo' | 'daimyo' | 'shogun';

interface UserLevelRequirement {
  level: UserLevel;
  requiredNft: number;
  requiredLineAmount: number;
  requiredOtherLines: number;
  profitShare: number | null;
}

const LEVEL_REQUIREMENTS: UserLevelRequirement[] = [
  {
    level: 'none',
    requiredNft: 0,
    requiredLineAmount: 0,
    requiredOtherLines: 0,
    profitShare: 0
  },
  {
    level: 'ashigaru',
    requiredNft: 1000,
    requiredLineAmount: 1000,
    requiredOtherLines: 0,
    profitShare: 45
  },
  {
    level: 'busho',
    requiredNft: 1000,
    requiredLineAmount: 3000,
    requiredOtherLines: 1500,
    profitShare: 25
  },
  {
    level: 'daikan',
    requiredNft: 1000,
    requiredLineAmount: 5000,
    requiredOtherLines: 2500,
    profitShare: 10
  },
  {
    level: 'bugyo',
    requiredNft: 1000,
    requiredLineAmount: 10000,
    requiredOtherLines: 5000,
    profitShare: 6
  },
  {
    level: 'roju',
    requiredNft: 1000,
    requiredLineAmount: 50000,
    requiredOtherLines: 25000,
    profitShare: null
  },
  {
    level: 'tairo',
    requiredNft: 1000,
    requiredLineAmount: 100000,
    requiredOtherLines: 50000,
    profitShare: 4
  },
  {
    level: 'daimyo',
    requiredNft: 1000,
    requiredLineAmount: 300000,
    requiredOtherLines: 150000,
    profitShare: null
  },
  {
    level: 'shogun',
    requiredNft: 1000,
    requiredLineAmount: 600000,
    requiredOtherLines: 500000,
    profitShare: 2
  }
];

interface UserLevelData {
  hasRequiredNft: boolean;  // SHOGUN NFT 1000所持
  maxLineAmount: number;    // 最大ラインの投資額
  otherLinesTotal: number;  // その他ラインの投資額合計
}

export function calculateUserLevel(data: UserLevelData): UserLevel {
  const { hasRequiredNft, maxLineAmount, otherLinesTotal } = data;

  // SHOGUN NFT 1000を持っていない場合はnone
  if (!hasRequiredNft) {
    return 'none';
  }

  // 足軽の要件チェック（NFT 1000 + 傘下投資額1000以上）
  if (maxLineAmount < 1000) {
    return 'none';
  }

  // 高いレベルから順にチェック
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    const requirement = LEVEL_REQUIREMENTS[i];
    
    if (
      maxLineAmount >= requirement.requiredLineAmount && 
      otherLinesTotal >= requirement.requiredOtherLines
    ) {
      return requirement.level;
    }
  }

  return 'none';
}

// レベルに関する追加のユーティリティ関数
export function getLevelProfitShare(level: UserLevel): number {
  const requirement = LEVEL_REQUIREMENTS.find(req => req.level === level);
  return requirement?.profitShare ?? 0;
}

export function getNextLevel(currentLevel: UserLevel): UserLevel | null {
  const currentIndex = LEVEL_REQUIREMENTS.findIndex(req => req.level === currentLevel);
  if (currentIndex < 0 || currentIndex === LEVEL_REQUIREMENTS.length - 1) {
    return null;
  }
  return LEVEL_REQUIREMENTS[currentIndex + 1].level;
}

export function getLevelRequirements(level: UserLevel): UserLevelRequirement | null {
  return LEVEL_REQUIREMENTS.find(req => req.level === level) ?? null;
} 