export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0=日曜日, 6=土曜日
}

export function isBusinessDay(date: Date): boolean {
    return !isWeekend(date);
}

export function getNextBusinessDay(date: Date): Date {
    const next = new Date(date);
    do {
        next.setDate(next.getDate() + 1);
    } while (isWeekend(next));
    return next;
} 