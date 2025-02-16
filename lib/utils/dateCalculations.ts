import { addDays, getNextMonday, startOfDay } from 'date-fns';

interface OperationDates {
    operationStartDate: Date;      // 運用開始日
    profitDisplayPeriod: {         // 報酬表示期間
        start: Date;
        end: Date;
    };
    taskPeriod: {                  // エアドロップタスク期間
        start: Date;
        end: Date;
    };
    rewardDate: Date;             // 報酬受け取り日
}

export function calculateOperationDates(purchaseDate: Date): OperationDates {
    const purchaseDay = startOfDay(purchaseDate);
    
    // 運用開始日（購入週の次の次の月曜日）
    const operationStartDate = getNextMonday(getNextMonday(purchaseDay));
    
    // 報酬表示期間（運用開始週の月～金）
    const profitDisplayPeriod = {
        start: operationStartDate,
        end: addDays(operationStartDate, 4)  // 金曜日
    };
    
    // エアドロップタスク期間（運用開始1週間後の月～金）
    const taskPeriod = {
        start: addDays(operationStartDate, 7),  // 次の週の月曜日
        end: addDays(operationStartDate, 11)    // 次の週の金曜日
    };
    
    // 報酬受け取り日（タスク期間終了後の次の月曜日）
    const rewardDate = addDays(taskPeriod.end, 3);  // タスク期間終了後の月曜日
    
    return {
        operationStartDate,
        profitDisplayPeriod,
        taskPeriod,
        rewardDate
    };
}

// 日付が平日（月～金）かどうかをチェック
export function isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;  // 1=月曜日, 5=金曜日
} 