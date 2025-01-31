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
            .select(`
                nfts (
                    price
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved')

        // 総投資額を計算
        const totalInvestment = purchases?.reduce((sum, purchase) => {
            return sum + (purchase.nfts?.price || 0)
        }, 0) || 0

        // ユーザーの投資額を更新
        await adminSupabase
            .from('users')
            .update({
                investment_amount: totalInvestment,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        return totalInvestment
    } catch (error) {
        console.error('Error recalculating investment:', error)
        throw error
    }
}

export async function POST(request: Request) {
    try {
        const { nftRequest, userId } = await request.json()
        const now = new Date()
        
        // 翌日の0時を設定
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        console.log('Processing request:', {
            nftRequest,
            userId,
            approvedAt: now.toISOString(),
            rewardStartsAt: tomorrow.toISOString()
        })

        // NFTマスターデータを取得
        const { data: nftMaster, error: nftError } = await adminSupabase
            .from('nft_master')
            .select('*')
            .eq('price', Number(nftRequest.nfts.price))
            .single()

        console.log('NFT master data:', {
            data: nftMaster,
            error: nftError
        })

        if (nftError || !nftMaster) {
            return NextResponse.json({ 
                error: 'NFTマスターデータの取得に失敗しました',
                details: nftError
            }, { status: 400 })
        }

        // NFTデータの準備
        const nftData = {
            name: nftRequest.nfts.name,
            price: nftMaster.price,
            daily_rate: nftMaster.daily_rate,
            image_url: nftMaster.image_url,
            description: nftMaster.description || `${nftRequest.nfts.name} - ${nftMaster.price.toLocaleString()} USDT - 日利上限${(nftMaster.daily_rate * 100).toFixed(2)}%`,
            nft_type: 'normal',
            owner_id: userId,
            last_transferred_at: tomorrow.toISOString(),  // 翌日0時を設定
            status: 'active'
        }

        console.log('Preparing to create NFT:', nftData)

        // 新しいNFTを作成
        const { data: newNft, error: createNftError } = await adminSupabase
            .from('nfts')
            .insert(nftData)
            .select()
            .single()

        if (createNftError) {
            console.error('NFT creation error:', {
                error: createNftError,
                data: nftData
            })
            return NextResponse.json({ 
                error: 'NFTの作成に失敗しました',
                details: createNftError
            }, { status: 400 })
        }

        console.log('Created NFT:', newNft)

        // 購入申請を承認
        const { error: updateError } = await adminSupabase
            .from('nft_purchase_requests')
            .update({
                status: 'approved',
                approved_at: now.toISOString(),  // 承認時刻は現在時刻
                nft_id: newNft.id
            })
            .eq('id', nftRequest.id)

        if (updateError) {
            console.error('Request update error:', updateError)
            return NextResponse.json({ 
                error: '購入申請の更新に失敗しました',
                details: updateError
            }, { status: 400 })
        }

        // 投資額を再計算
        await recalculateUserInvestment(userId)

        return NextResponse.json({ 
            success: true, 
            nft: newNft,
            message: 'NFTの作成と購入申請の承認が完了しました'
        })

    } catch (error) {
        console.error('Unexpected error in approve NFT:', error)
        return NextResponse.json({ 
            error: '処理に失敗しました',
            details: error
        }, { status: 500 })
    }
} 