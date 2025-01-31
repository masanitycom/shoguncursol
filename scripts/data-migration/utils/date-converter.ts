export function convertDate(dateStr: string): string {
    try {
        const date = new Date(dateStr)
        return date.toISOString()
    } catch (error) {
        console.error('Date conversion error:', error)
        return new Date().toISOString() // フォールバック
    }
} 