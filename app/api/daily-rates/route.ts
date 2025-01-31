import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
            return NextResponse.json({ rates: [] })
        }

        const { data: userNfts } = await supabase
            .from('user_nfts')
            .select('nft_id')
            .eq('user_id', session.user.id)
            .eq('status', 'active')

        if (!userNfts?.length) {
            return NextResponse.json({ rates: [] })
        }

        // 今日の日付
        const today = new Date().toISOString().split('T')[0]

        // NFTごとの日利を取得
        const { data: rates } = await supabase
            .from('daily_rates')
            .select(`
                rate,
                nft_master (
                    id,
                    name,
                    price,
                    daily_rate,
                    image_url
                )
            `)
            .eq('date', today)
            .in('nft_id', userNfts.map(un => un.nft_id))

        return NextResponse.json({ rates })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ rates: [] })
    }
} 