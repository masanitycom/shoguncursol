import { supabase } from '@/lib/supabase'

export async function migrateUserIds() {
    try {
        // 既存のユーザーを取得
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .is('user_id', null)  // user_idが未設定のユーザーのみ

        if (error) throw error

        // 各ユーザーのuser_idを設定
        for (const profile of profiles) {
            const userId = profile.email.split('@')[0]  // メールアドレスの@前をIDとして使用
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ user_id: userId })
                .eq('id', profile.id)

            if (updateError) {
                console.error(`Failed to update user ${profile.id}:`, updateError)
                continue
            }
        }

        console.log(`Successfully migrated ${profiles.length} users`)
        return { success: true, count: profiles.length }

    } catch (error) {
        console.error('Migration failed:', error)
        return { success: false, error }
    }
}

export const migrateUserFromCSV = async (
    displayId: string,
    name: string,
    email: string | null,
    investment: number,
    referrerId: string,
    createdAt: string  // 登録日を引数に追加
) => {
    // メールアドレスでも重複チェック
    const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_id.eq.${displayId},email.eq.${email}`)

    if (!searchError && existingUsers?.length > 0) {
        // 既存ユーザーの更新
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                name,
                email,
                investment,
                referrer: referrerId,
                display_id: displayId,
                created_at: createdAt,
                updated_at: createdAt
            })
            .eq('id', existingUsers[0].id)

        return {
            success: !updateError,
            status: 'updated',
            error: updateError
        }
    }

    // 新規ユーザーの作成
    const { error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: crypto.randomUUID(),
            display_id: displayId,
            name,
            email,
            investment,
            referrer: referrerId,
            created_at: createdAt,
            updated_at: createdAt,
            active: true
        })

    return {
        success: !insertError,
        status: insertError ? 'error' : 'created',
        error: insertError
    }
} 