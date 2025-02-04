'use client'

import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

interface NFT {
    id: string
    name: string
    price: number
    daily_rate: number
    description?: string
    image_url?: string
    nft_type: string
    status: string
}

interface NFTCardProps {
    nft: NFT
}

// 名前付きエクスポートとして定義
export function NFTCard({ nft }: NFTCardProps): JSX.Element {
    const dailyRatePercent = (nft.daily_rate * 100).toFixed(2)

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
                <Image
                    src={nft.image_url || '/images/default-nft.png'}
                    alt={nft.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{nft.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{nft.description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-700">価格: {formatPrice(nft.price)} USDT</p>
                        <p className="text-gray-700">日利上限: {dailyRatePercent}%</p>
                    </div>
                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={() => {
                            console.log('Purchase NFT:', nft.id)
                        }}
                    >
                        購入
                    </button>
                </div>
            </div>
        </div>
    )
} 