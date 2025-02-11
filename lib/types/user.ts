export interface UserStats {
    personalInvestment: number;
    maxLine: number;
    otherLines: number;
    teamInvestment: number;
}

export interface UserLevel {
    level: string;
    stats: UserStats;
} 