import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 投資額を再計算する関数
const recalculateUserInvestment = async (userId: string) => {
    try {
        // 承認済み購入履歴から投資額を計算
        const { data: purchases } = await adminSupabase
            .from('nft_purchase_requests')
            .select('amount')
            .eq('user_id', userId)
            .eq('status', 'approved')

        // 総投資額を計算
        const totalInvestment = purchases?.reduce((sum, purchase) => {
            return sum + (purchase.amount || 0)
        }, 0) || 0

        // ユーザーの投資額を更新
        await adminSupabase
            .from('users')
            .update({ total_investment: totalInvestment })
            .eq('id', userId)

    } catch (error) {
        console.error('Error recalculating investment:', error)
        throw new Error('投資額の更新に失敗しました')
    }
}

interface ApproveRequestBody {
    requestId: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as ApproveRequestBody;
        const { requestId } = body;
        console.log('Processing request:', requestId)

        // 1. 購入申請の情報を取得
        const { data: purchaseRequest, error: fetchError } = await adminSupabase
            .from('nft_purchase_requests')
            .select('*')
            .eq('id', requestId)
            .single()

        if (fetchError) {
            console.error('Fetch error:', fetchError)
            throw new Error('購入申請の取得に失敗しました')
        }

        // 2. 購入申請のステータスを更新
        const { error: updateError } = await adminSupabase
            .from('nft_purchase_requests')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', requestId)

        if (updateError) {
            throw new Error('購入申請の更新に失敗しました')
        }

        // 3. ユーザーの総投資額を更新
        await recalculateUserInvestment(purchaseRequest.user_id)

        return NextResponse.json({ 
            success: true,
            message: '購入申請が承認されました'
        })

    } catch (error: any) {
        console.error('Approval error:', error)
        return NextResponse.json({ 
            error: error.message || 'NFTの承認に失敗しました',
            details: error
        }, { status: 400 })
    }
} 