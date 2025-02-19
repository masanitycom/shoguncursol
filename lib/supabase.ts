import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env.localを読み込む
dotenv.config({ path: '.env.local' })

// 環境変数のチェックと取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase Config:', {
    url: supabaseUrl,
    hasKey: !!supabaseKey,
    keyLength: supabaseKey?.length
})

console.log('Initializing Supabase client')

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseKey)

// 初期化時のセッション確認
supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('Initial auth state:', {
        isAuthenticated: !!session,
        user: session?.user?.email
    })
})

// 認証状態の変更を監視する関数
export const handleAuthStateChange = (event: string, session: any) => {
    console.log('Auth state changed:', { event, session })
    
    if (event === 'SIGNED_OUT') {
        // 現在のパスを確認
        const currentPath = window.location.pathname
        const redirectPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login'
        
        // 強制的にページ遷移
        window.location.replace(redirectPath)
    }
}

// 初期設定
supabase.auth.onAuthStateChange(handleAuthStateChange)