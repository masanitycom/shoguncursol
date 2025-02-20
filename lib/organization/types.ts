export interface NFTSettings {
    id: string;
    price: number;
    name?: string;
}

export interface NFTPurchaseRequest {
    id: string;
    status: string;
    nft_id: string;
    nft_settings: NFTSettings;
}

export interface OrganizationMember {
    id: string;
    display_id: string;
    name: string | null;
    email: string;
    referrer_id: string | null;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    created_at: string;
    children: OrganizationMember[];
    nft_purchase_requests: NFTPurchaseRequest[];
} 