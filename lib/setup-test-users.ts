import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestUsers() {
    try {
        // 既存のユーザーを削除
        const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .in('email', ['testuser@gmail.com', 'testadmin@gmail.com'])

        if (existingUsers && existingUsers.length > 0) {
            for (const user of existingUsers) {
                await supabase.auth.admin.deleteUser(user.id)
            }
        }

        // テストユーザーの作成
        const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
            email: 'testuser@gmail.com',
            password: 'test123',
            email_confirm: true
        })

        if (userError) throw userError

        // 管理者の作成
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
            email: 'testadmin@gmail.com',
            password: 'admin123',
            email_confirm: true
        })

        if (adminError) throw adminError

        // usersテーブルにデータを挿入
        await supabase.from('users').upsert([
            {
                id: testUser.user.id,
                user_id: 'TEST001',
                name_kana: 'テスト ユーザー',
                email: 'testuser@gmail.com',
                phone: '09012345678'
            },
            {
                id: adminUser.user.id,
                user_id: 'ADMIN001',
                name_kana: 'テスト カンリシャ',
                email: 'testadmin@gmail.com',
                phone: '09087654321'
            }
        ])

        console.log('Test users created successfully')
    } catch (error) {
        console.error('Error setting up test users:', error)
    }
}

setupTestUsers()