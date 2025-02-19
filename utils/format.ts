/**
 * 数値を通貨形式にフォーマット
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('ja-JP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * 日付を日本語形式にフォーマット
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 価格をUSDT形式にフォーマット
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('ja-JP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercent(value: number): string {
    return new Intl.NumberFormat('ja-JP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'percent'
    }).format(value / 100);
} 