const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// .env.localファイルのパスを設定
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Environment variables:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
    })
    throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
})

interface User {
    id: string
    email: string | null
    // 他の必要なプロパティがあれば追加
}

async function setupTestUsers() {
    try {
        console.log('Starting user setup with:', {
            url: supabaseUrl,
            hasServiceKey: !!supabaseServiceKey
        })

        // 既存のユーザーを削除
        const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers()
        if (getUsersError) {
            console.error('Error listing users:', getUsersError)
            return
        }

        const existingUsers = users.users.filter((user: User) => 
            ['testuser@gmail.com', 'testadmin@gmail.com'].includes(user.email || '')
        )

        if (existingUsers.length > 0) {
            console.log('Deleting existing users:', existingUsers.map((u: User) => u.email))
            for (const user of existingUsers) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
                if (deleteError) {
                    console.error('Error deleting user:', deleteError)
                }
            }
        }

        // テストユーザーの作成
        console.log('Creating test user...')
        const { data: testUser, error: userError } = await supabase.auth.admin.createUser({
            email: 'testuser@gmail.com',
            password: 'test123',
            email_confirm: true,
            user_metadata: { role: 'user' }
        })

        if (userError) {
            console.error('Error creating test user:', userError)
            return
        }
        console.log('Test user created:', testUser.user)

        // 管理者の作成
        console.log('Creating admin user...')
        const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
            email: 'testadmin@gmail.com',
            password: 'admin123',
            email_confirm: true,
            user_metadata: { role: 'admin' }
        })

        if (adminError) {
            console.error('Error creating admin user:', adminError)
            return
        }
        console.log('Admin user created:', adminUser.user)

        // usersテーブルにデータを挿入
        console.log('Inserting user data...')
        const { error: insertError } = await supabase.from('users').upsert([
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

        if (insertError) {
            console.error('Error inserting user data:', insertError)
            return
        }

        console.log('Test users created successfully')
    } catch (error) {
        console.error('Error setting up test users:', error)
    }
}

setupTestUsers() 