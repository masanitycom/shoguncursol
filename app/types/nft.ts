export interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string | null;
}

export interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    approved_at: string | null;
    nft_settings: NFTSettings;
} 