import { createClient } from '@supabase/supabase-js'

// 環境変数を直接使用
const supabaseUrl = 'https://atvspduydtqimjnaliob.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnNwZHV5ZHRxaW1qbmFsaW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNDk4MTYsImV4cCI6MjA1MzcyNTgxNn0.fxgQU2O_23Uh4zKmZzIjPoDX_Ias5aWfMUTJ8uB5iLU'

console.log('Supabase Config:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
})

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
}

console.log('Initializing Supabase client')

// 単一のsupabaseインスタンスを作成
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        },
        db: {
            schema: 'public'
        }
    }
)

// 初期化時のセッション確認
supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Initial auth state:', {
        isAuthenticated: !!session,
        user: session?.user?.email
    })
})

// 認証状態の変更監視
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', {
        event,
        user: session?.user?.email,
        metadata: session?.user?.user_metadata
    })
})