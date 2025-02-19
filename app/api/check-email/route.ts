import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()
        const supabase = createRouteHandlerClient({ cookies })

        // メールアドレスでユーザーを検索
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single()

        if (error) {
            throw error
        }

        // ユーザーが存在する場合はtrue、存在しない場合はfalseを返す
        return NextResponse.json({
            exists: !!data
        })

    } catch (error) {
        console.error('Error checking email:', error)
        return NextResponse.json(
            { error: 'メールアドレスの確認中にエラーが発生しました' },
            { status: 500 }
        )
    }
} 