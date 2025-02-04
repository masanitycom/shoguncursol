'use client'

import { NFTCard } from '@/components/NFTCard'

// NFTCardコンポーネントが期待する型
interface NFTCardProps {
    id: string
    name: string
    price: number
    daily_rate: number
    image_url: string | null
    created_at: string
}

// 購入画面で使用するNFTの型
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

interface NFTListProps {
    nfts: NFT[]
    onSelect: (nft: NFT) => void
    selectedNFT: NFT | null
}

export default function NFTList({ nfts, onSelect, selectedNFT }: NFTListProps) {
    if (!nfts || nfts.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">NFT購入</h1>
                <p>現在購入可能なNFTはありません。</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">NFT購入</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft) => {
                    // NFTCardコンポーネントに渡すデータを変換
                    const cardProps: NFTCardProps = {
                        id: nft.id,
                        name: nft.name,
                        price: nft.price,
                        daily_rate: nft.daily_rate,
                        image_url: nft.image_url || null,
                        created_at: new Date().toISOString() // 購入画面では現在時刻を使用
                    }

                    return (
                        <div
                            key={nft.id}
                            onClick={() => onSelect(nft)}
                            className={`cursor-pointer transition-transform transform hover:scale-105 ${
                                selectedNFT?.id === nft.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                        >
                            <NFTCard nft={cardProps} />
                        </div>
                    )
                })}
            </div>
        </div>
    )
} 