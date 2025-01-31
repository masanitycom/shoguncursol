import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// 独立した設定
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const testNFTs = [
    {
        name: '侍の刀',
        description: '伝説の侍が使用していた刀。切れ味は抜群。',
        image_url: '/images/nfts/katana.jpg',
        price: 1000000,
        status: 'available'
    },
    {
        name: '将軍の兜',
        description: '戦国時代の将軍が着用していた兜。威厳がある。',
        image_url: '/images/nfts/kabuto.jpg',
        price: 2000000,
        status: 'available'
    },
    {
        name: '忍者の手裏剣',
        description: '忍者が使用していた手裏剣。投げやすい形状。',
        image_url: '/images/nfts/shuriken.jpg',
        price: 500000,
        status: 'available'
    },
    {
        name: '武将の鎧',
        description: '有名な武将が着用していた鎧。高い防御力を誇る。',
        image_url: '/images/nfts/yoroi.jpg',
        price: 3000000,
        status: 'available'
    },
    {
        name: '茶人の茶碗',
        description: '名工が作った茶碗。風情がある。',
        image_url: '/images/nfts/chawan.jpg',
        price: 800000,
        status: 'available'
    }
]

async function main() {
    try {
        console.log('Setting up test NFTs...')
        console.log('Using Supabase URL:', supabaseUrl)

        // 認証状態を確認
        const { data: { session }, error: authError } = await supabaseAdmin.auth.getSession()
        if (authError) {
            console.error('Auth error:', authError)
            throw authError
        }
        console.log('Authenticated as:', session?.user?.email)

        // 既存のNFTを削除
        const { error: deleteError } = await supabaseAdmin
            .from('nfts')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
            console.error('Delete error:', deleteError)
            throw deleteError
        }
        console.log('Existing NFTs deleted')

        // テストNFTを一括挿入
        console.log('Inserting test NFTs:', testNFTs)
        const { error: insertError, data: insertedData } = await supabaseAdmin
            .from('nfts')
            .insert(testNFTs)
            .select()

        if (insertError) {
            console.error('Insert error:', insertError)
            throw insertError
        }

        // 挿入後のデータを確認
        const { data: allData, error: selectError } = await supabaseAdmin
            .from('nfts')
            .select('*')
            .order('created_at', { ascending: false })

        if (selectError) {
            console.error('Select error:', selectError)
            throw selectError
        }

        console.log('Total NFTs in database:', allData?.length)
        console.log('All NFTs:', allData)
        console.log('Test NFTs setup completed!')
    } catch (error) {
        console.error('Error setting up test NFTs:', error)
        process.exit(1)
    }
}

main() 