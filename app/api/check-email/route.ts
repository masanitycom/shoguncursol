import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()
        const supabase = createRouteHandlerClient({ cookies })

        const { data, error } = await supabase.auth.admin.listUsers({
            filters: {
                email: email
            }
        })

        if (error) throw error

        return NextResponse.json({
            exists: data.users.length > 0
        })

    } catch (error) {
        console.error('Email check error:', error)
        return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
    }
} 