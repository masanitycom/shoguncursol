export function formatDate(date: Date | string | null): string {
    if (!date) return '未設定';
    
    // UTCをJSTに変換
    const jstDate = new Date(date);
    jstDate.setHours(jstDate.getHours() + 9);

    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
    }).format(jstDate);
}

export function formatDateTime(date: Date | string | null): string {
    if (!date) return '未設定';

    // UTCをJSTに変換
    const jstDate = new Date(date);
    jstDate.setHours(jstDate.getHours() + 9);

    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
    }).format(jstDate);
}

export function getJSTDate(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

export function calculateOperationStartDate(baseDate: Date): string {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + 14); // 2週間後を運用開始日とする
    return date.toISOString();
} 