export function calculateDailyRateStartDate(purchaseDate: Date): Date {
    // 30日後の日付を計算
    const thirtyDaysLater = new Date(purchaseDate)
    thirtyDaysLater.setDate(purchaseDate.getDate() + 30)
    
    // その週の月曜日を取得
    const monday = new Date(thirtyDaysLater)
    const dayOfWeek = monday.getDay() // 0 = 日曜日, 1 = 月曜日, ...
    
    if (dayOfWeek === 0) { // 日曜日の場合
        monday.setDate(monday.getDate() + 1)
    } else if (dayOfWeek > 1) { // 火曜日以降の場合
        monday.setDate(monday.getDate() + (8 - dayOfWeek))
    }
    
    return monday
}

export function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay()
    return dayOfWeek >= 1 && dayOfWeek <= 5 // 月曜日から金曜日
} 