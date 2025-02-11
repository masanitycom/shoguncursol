import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env.localを読み込む
dotenv.config({ path: '.env.local' })

// 環境変数のチェックと取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
}

if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
}

console.log('Supabase Config:', {
    url: supabaseUrl,
    hasKey: !!supabaseServiceKey,
    keyLength: supabaseServiceKey?.length
})

console.log('Initializing Supabase client')

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

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