// 共通の型定義ファイル
export interface Member {
    id: string;
    display_id: string;
    name: string;
    email: string;
    name_kana: string;
    display_name: string;
    investment_amount: number;
    level: number;
    referrer_id: string | null;
    children: Member[];
    total_team_investment: number;
    maxLine?: number;
    otherLines?: number;
}

// オプションとして、データベースから取得する生のデータの型も定義
export interface RawUserData {
    id: string;
    name: string | null;
    email: string;
    display_id: string | null;
    name_kana: string | null;
    level: number;
    referrer_id: string | null;
    investment_amount: number | null;
}

// 組織ツリーのノード型
export interface OrganizationNode extends Member {
    children: OrganizationNode[];
}

export interface OrganizationMember {
    id: string;
    display_id: string;
    name: string;
    email: string;
    display_name: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    children: OrganizationMember[];
    nft_purchase_requests: {
        id: string;
        status: string;
        created_at: string;
        approved_at: string | null;
        nft_settings: {
            id: string;
            name: string;
            price: number;
            daily_rate: number;
            image_url: string | null;
            description: string | null;
        };
    }[];
} 