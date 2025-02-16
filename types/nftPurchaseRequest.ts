export interface PurchaseRequest {
    id: string;
    user_id: string;
    nft_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    rejected_at?: string;
    rejection_reason?: string;
    payment_method: string;
    price?: number;
    user?: {
        name: string;
        email: string;
    };
    nft?: {
        name: string;
        price: number;
    };
}

export type NFTPurchaseRequest = PurchaseRequest; 