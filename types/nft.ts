export type NFTType = {
  id: number
  name: string
  price: number
  maxDailyRate: number
  isLegacy: boolean
}

export type UserNFT = {
  id: string
  userId: string
  nftTypeId: number
  purchaseDate: Date
  initialAmount: number
  currentAmount: number
  isActive: boolean
  nftType?: NFTType
}

export type DailyRate = {
  id: string
  nftTypeId: number
  date: Date
  rate: number
  weekId: string
}

export type NFTDailyProfit = {
  id: string
  userNftId: string
  date: Date
  rate: number
  profitAmount: number
  isAirdropped: boolean
}

export interface NFT {
    id: string
    name: string
    description: string
    image_url: string
    price: number
    owner_id: string | null
    created_at: string
    status: 'available' | 'sold' | 'locked'
} 