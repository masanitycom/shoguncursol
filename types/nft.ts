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
    id: string;
    nft_id: string;
    purchase_date: string;
    status: string;
    nft_purchase_requests?: {
        approved_at: string;
    }[];
    nft?: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    };
    nft_settings?: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    };
}

export interface NFTPurchaseRequest {
    id: string
    user_id: string
    nft_id: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    approved_at?: string
    nft?: {
        id: string
        name: string
        price: number
        daily_rate: number
        image_url: string | null
    }
} 