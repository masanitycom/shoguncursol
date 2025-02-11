interface NFTSettings {
    id: string;
    name: string;
    price: number;
}

interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: string;
    created_at: string;
    nft_settings: NFTSettings;
} 