interface DailyReward {
  id: string;
  userId: string;
  nftId: string;
  rate: number;
  date: Date;
  amount: number;
  isHoliday: boolean;
  status: "CALCULATED" | "DISTRIBUTED" | "FAILED";
  createdAt: Date;
}

interface WeeklyReward {
  id: string;
  startDate: Date;
  endDate: Date;
  totalProfit: number;
  distributionAmount: number;
  userDistributions: UserDistribution[];
  status: "PENDING" | "CALCULATED" | "DISTRIBUTED";
  createdAt: Date;
  distributedAt?: Date;
}

interface UserDistribution {
  id: string;
  userId: string;
  weeklyRewardId: string;
  rank: UserRank;
  distributionRate: number;
  amount: number;
  status: "PENDING" | "DISTRIBUTED";
  distributedAt?: Date;
}

enum UserRank {
  NONE = "なし",
  ASHIGARU = "足軽",
  BUSHO = "武将",
  DAIKAN = "代官",
  BUGYO = "奉行",
  ROCHU = "老中",
  DAIMYO = "大名",
  SHOGUN = "将軍"
} 