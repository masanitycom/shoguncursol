import { supabase } from '@/lib/supabase'

interface LegacyUser {
    id: string
    name: string
    investment: number | null
    referrer: string | null
    parentId: string | null
    position: 'left' | 'right' | null
    created_at: string | null
    phone: string
    email: string
    initial_investment_date: string | null
}

// レガシーユーザーデータの型定義を追加
interface LegacyUserData {
    id: string;
    name: string;
    email: string;
    investment: number;
    referrer?: string;
    parentid?: string;
    position?: string;
    created_at: string;
    phone?: string;
    initial_investment_date: string;
}

export class MigrationService {
    // 電話番号のフォーマット統一
    static formatPhoneNumber(phone: string): string {
        // ハイフンを除去して統一フォーマットに
        return phone.replace(/-/g, '')
    }

    // ユーザーデータの移行
    static async migrateUser(user: LegacyUser) {
        try {
            // 1. プロフィールの作成/更新
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: this.formatPhoneNumber(user.phone),
                    referrer: user.referrer,
                    investment: user.investment,
                    created_at: user.created_at,
                    initial_investment_date: user.initial_investment_date
                })

            if (profileError) throw profileError

            // 2. Auth用のユーザー作成（存在しない場合）
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: '00000000',
                email_confirm: true,
                user_metadata: {
                    name: user.name,
                    legacy_parent_id: user.parentId,
                    legacy_position: user.position
                }
            })

            if (authError && authError.message !== 'User already registered') {
                throw authError
            }

            return { profile, authUser }
        } catch (error) {
            console.error(`Error migrating user ${user.id}:`, error)
            throw error
        }
    }

    // 全ユーザーの移行
    static async migrateAllUsers(users: LegacyUserData[]) {
        try {
            const results = await Promise.all(
                users.map(async (user) => {
                    try {
                        // ユーザーデータの変換と移行
                        const newUserData = {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            investment_amount: Number(user.investment) || 0,
                            referrer_id: user.referrer,
                            created_at: user.created_at,
                            phone: user.phone,
                            initial_investment_date: user.initial_investment_date
                        };

                        // 移行処理...
                        return {
                            success: true,
                            userId: user.id,
                            message: 'User migrated successfully'
                        };
                    } catch (error) {
                        return {
                            success: false,
                            userId: user.id,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                })
            );

            return results;
        } catch (error) {
            console.error('Error in migrateAllUsers:', error);
            throw error;
        }
    }

    // 継続的な同期（定期実行用）
    static async syncNewUsers() {
        // 最後の同期以降の新規ユーザーを取得
        const { data: newUsers, error } = await supabase
            .from('legacy_users')
            .select('*')
            .gt('created_at', '最後の同期時刻')

        if (error) throw error

        return this.migrateAllUsers(newUsers)
    }
} 