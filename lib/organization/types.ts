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
    name: string;
    email: string;
    level?: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    nft_purchase_requests: any[];
    children: OrganizationMember[];
} 