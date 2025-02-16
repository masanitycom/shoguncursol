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
    const now = new Date();
    now.setHours(now.getHours() + 9);
    return now;
}

export function calculateOperationStartDate(purchaseDate: Date): Date {
    const startDate = new Date(purchaseDate);
    startDate.setHours(startDate.getHours() + 9); // JSTに変換
    startDate.setDate(startDate.getDate() + 14);  // 2週間後
    return startDate;
} 