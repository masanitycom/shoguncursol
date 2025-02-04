export function formatPrice(price: number): string {
    return new Intl.NumberFormat('ja-JP').format(price)
} 