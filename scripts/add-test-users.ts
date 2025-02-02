import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// 環境変数の確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseServiceKey?.length
})

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function addTestUsers() {
    try {
        // まず既存のユーザーを確認
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) {
            throw new Error(`Failed to list users: ${listError.message}`)
        }

        console.log('Current users:', users.map(u => u.email))

        const testUsers = [
            {
                email: 'masakuma1108@gmail.com',
                password: 'test123',
                user_metadata: {
                    name_kana: 'テストユーザー1',
                    role: 'user'
                }
            },
            {
                email: 'torucajino@gmail.com',
                password: 'test123',
                user_metadata: {
                    name_kana: 'テストユーザー2',
                    role: 'user'
                }
            }
        ]

        for (const user of testUsers) {
            console.log(`\nProcessing ${user.email}...`)

            // 既存ユーザーの削除
            const existingUser = users.find(u => u.email === user.email)
            if (existingUser) {
                console.log(`Deleting existing user: ${existingUser.id}`)
                const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
                if (deleteError) {
                    console.error(`Failed to delete user: ${deleteError.message}`)
                    continue
                }
            }

            // 新規ユーザーの作成
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: user.user_metadata
            })

            if (createError) {
                console.error(`Failed to create user: ${createError.message}`)
            } else {
                console.log('User created successfully:', {
                    id: newUser.user.id,
                    email: newUser.user.email,
                    confirmed: newUser.user.email_confirmed_at
                })

                // プロフィールデータの作成
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: newUser.user.id,
                        name_kana: user.user_metadata.name_kana,
                        role: user.user_metadata.role,
                        active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })

                if (profileError) {
                    console.error(`Failed to create profile: ${profileError.message}`)
                }
            }
        }
    } catch (error) {
        console.error('Fatal error:', error)
        throw error
    }
}

console.log('Starting user setup...')
addTestUsers()
    .then(() => {
        console.log('Setup completed successfully')
        process.exit(0)
    })
    .catch(error => {
        console.error('Setup failed:', error)
        process.exit(1)
    })