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