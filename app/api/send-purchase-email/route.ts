import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
// @ts-ignore
import nodemailer from 'nodemailer'

interface EmailRequestBody {
    nftName: string;
    price: number;
    paymentMethod: 'bank_transfer' | 'usdt';
    userEmail?: string;
    userName?: string;
}

// メール送信の設定
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as EmailRequestBody
        const { nftName, price, paymentMethod, userEmail, userName } = body

        // ユーザーへのメール
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: userEmail,
            subject: `NFT購入申請を受け付けました`,
            text: `${userName}様\n\n以下の内容で購入申請を受け付けました。\n\nNFT: ${nftName}\n価格: ${price.toLocaleString()} USDT\n支払方法: ${paymentMethod === 'bank_transfer' ? '銀行振込' : 'USDT送金'}`,
            html: `
                <h2>NFT購入申請を受け付けました</h2>
                <p>${userName}様</p>
                <p>以下の内容で購入申請を受け付けました。</p>
                <ul>
                    <li>NFT: ${nftName}</li>
                    <li>価格: ${price.toLocaleString()} USDT</li>
                    <li>支払方法: ${paymentMethod === 'bank_transfer' ? '銀行振込' : 'USDT送金'}</li>
                </ul>
                <p>支払い確認後、NFTが付与されます。</p>
                ${paymentMethod === 'bank_transfer' ? `
                    <h3>振込先情報</h3>
                    <p>銀行名: ○○銀行</p>
                    <p>支店名: ○○支店</p>
                    <p>口座番号: 1234567</p>
                    <p>口座名義: XXXXX</p>
                ` : `
                    <h3>USDT送金先</h3>
                    <p>0x1234567890abcdef1234567890abcdef12345678</p>
                `}
            `
        })

        // 管理者へのメール
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: '新規NFT購入申請がありました',
            html: `
                <h2>新規NFT購入申請</h2>
                <ul>
                    <li>ユーザー: ${session.user.email}</li>
                    <li>NFT: ${nftName}</li>
                    <li>価格: ${price.toLocaleString()} USDT</li>
                    <li>支払方法: ${paymentMethod === 'bank_transfer' ? '銀行振込' : 'USDT送金'}</li>
                </ul>
                <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/purchase-requests">管理画面で確認する</a></p>
            `
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Email sending error:', error)
        return NextResponse.json({ 
            error: 'Failed to send email',
            details: error 
        }, { 
            status: 500 
        })
    }
} 