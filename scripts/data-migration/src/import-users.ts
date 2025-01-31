import { supabase } from '../../../lib/supabase'
import { OldUser } from '../types/old-data.types'
import { validateUserData } from '../utils/data-validator'
import { convertDate } from '../utils/date-converter'
import { users as oldUsers } from '../data/users.json'

async function importUsers() {
    console.log('Starting user import...')
    let success = 0
    let failed = 0

    for (const oldUser of oldUsers) {
        try {
            // データ検証
            if (!validateUserData(oldUser)) {
                throw new Error(`Invalid user data: ${oldUser.id}`)
            }

            // ユーザーデータのインポート
            const { error } = await supabase
                .from('users')
                .insert({
                    id: oldUser.id,
                    user_id: oldUser.user_id,
                    name_kana: oldUser.name_kana,
                    email: oldUser.email,
                    wallet_address: oldUser.wallet_address,
                    wallet_type: oldUser.wallet_type,
                    active: true,
                    created_at: convertDate(oldUser.created_at),
                    updated_at: convertDate(oldUser.updated_at)
                })

            if (error) throw error
            success++
            console.log(`Imported user: ${oldUser.email}`)

        } catch (error) {
            failed++
            console.error(`Failed to import user: ${oldUser.email}`, error)
        }
    }

    console.log(`Import completed. Success: ${success}, Failed: ${failed}`)
}

// スクリプト実行
if (require.main === module) {
    importUsers()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Import failed:', error)
            process.exit(1)
        })
} 