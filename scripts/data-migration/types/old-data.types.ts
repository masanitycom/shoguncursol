export interface OldUser {
    id: string
    user_id: string
    name_kana: string
    email: string
    wallet_address: string
    wallet_type: string
    created_at: string
    updated_at: string
}

export interface OldNFTPurchase {
    id: string
    user_id: string
    nft_id: string
    price: number
    status: 'approved' | 'pending' | 'rejected'
    created_at: string
    approved_at?: string
} 