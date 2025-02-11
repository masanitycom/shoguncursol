export interface NFTSettings {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    image_url: string | null;
    description: string | null;
    status?: string | null;
    owner_id?: string | null;
} 