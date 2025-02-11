export interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'deactivated';
    created_at: string;
    approved_at: string | null;
    payment_method: string;
    user?: {
        id: string;
        name: string;
        email: string;
        display_id: string;
    };
    nft?: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url: string | null;
    };
} 