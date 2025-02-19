import { addDays, nextMonday, startOfDay } from 'date-fns';

interface OperationDates {
    operationStartDate: Date;      // 運用開始日
    nextClaimStartDate: Date;      // 次回の報酬申請開始日
    nextClaimEndDate: Date;        // 次回の報酬申請終了日
    nextPaymentDate: Date;         // 次回の支払予定日
}

export function calculateOperationDates(purchaseDate: Date): OperationDates {
    const startDate = startOfDay(purchaseDate);
    const operationStartDate = addDays(startDate, 14); // 購入から2週間後
    const nextClaimStartDate = nextMonday(operationStartDate); // 次の月曜日
    const nextClaimEndDate = addDays(nextClaimStartDate, 4); // 月曜から4日後（金曜日）
    const nextPaymentDate = addDays(nextClaimEndDate, 3); // 金曜から3日後（翌週月曜）

    return {
        operationStartDate,
        nextClaimStartDate,
        nextClaimEndDate,
        nextPaymentDate
    };
}

export function isBusinessDay(date: Date): boolean {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0は日曜、6は土曜
}

export function getNextBusinessDay(date: Date): Date {
    const nextDay = addDays(date, 1);
    return isBusinessDay(nextDay) ? nextDay : getNextBusinessDay(nextDay);
}

// 日付が平日（月～金）かどうかをチェック
export function isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;  // 1=月曜日, 5=金曜日
} 