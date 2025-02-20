export interface DailyProfitInfo {
    dailyAmount: number;    // その日の報酬額
    totalAmount: number;    // 累計報酬額
    lastCalculatedDate: Date; // 最終計算日
}

export function calculateDailyProfit(
    purchaseAmount: number,
    dailyRate: number,
    startDate: Date,
    currentDate: Date = new Date()
): DailyProfitInfo {
    // 土日を除いた営業日数を計算
    const businessDays = getBusinessDaysBetween(startDate, currentDate);
    
    // 日利計算（単利）
    const dailyAmount = Math.round(purchaseAmount * dailyRate) / 100;
    const totalAmount = dailyAmount * businessDays;

    return {
        dailyAmount,
        totalAmount,
        lastCalculatedDate: currentDate
    };
}

function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=日曜, 6=土曜
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
} 