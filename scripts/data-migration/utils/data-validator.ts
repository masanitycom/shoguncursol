import { OldUser } from '../types/old-data.types'

export function validateUserData(user: OldUser): boolean {
    // 必須フィールドの存在チェック
    if (!user.id || !user.user_id || !user.email) {
        console.error('Missing required fields:', user)
        return false
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(user.email)) {
        console.error('Invalid email format:', user.email)
        return false
    }

    // 日付形式のチェック
    const dateRegex = /^\d{4}-\d{2}-\d{2}/
    if (!dateRegex.test(user.created_at)) {
        console.error('Invalid date format:', user.created_at)
        return false
    }

    return true
} 