import { UserProfile } from '@/types/user';

// NodeType型の定義を追加
export type NodeType = UserProfile & BaseNode & {
    children: Array<UserProfile & BaseNode & {
        children: UserProfile[];
    }>;
    max_line_investment: number;      // スネークケースに統一
    other_lines_investment: number;   // スネークケースに統一
};

// データベースの型定義（スネークケース）
export interface DatabaseSchema {
    id: string;
    user_id: string;
    display_id: string;
    name: string;
    email: string;
    name_kana: string | null;
    investment_amount: number;
    total_team_investment: number;
    max_line_investment: number;
    other_lines_investment: number;
    level: string;
    referrer_id: string | null;
    created_at: string;
    updated_at: string;
}

// フロントエンドの型定義（キャメルケース）
export interface BaseNode {
    readonly id: string;
    readonly displayId: string;  // display_id → displayId
    readonly name: string;
    readonly email: string;
    readonly nameKana?: string;
    readonly investmentAmount: number;
    readonly totalTeamInvestment: number;
    readonly maxLineInvestment: number;
    readonly otherLinesInvestment: number;
    readonly level?: string;
    readonly referrerId: string | null;
}

// 組織ノードの定義
export interface OrganizationNode extends BaseNode {
    readonly children: OrganizationNode[];
}

// 組織メンバー
export interface OrganizationMember {
    id: string;
    display_id: string;
    name: string;
    email?: string;
    display_name?: string;
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    children: OrganizationMember[];
}

// ユーザービュー用のデータ構造
export interface UserViewData extends BaseNode {
    readonly children: UserViewData[];
}

// 組織ツリーノード
export interface OrganizationTreeNode extends BaseNode {
    readonly investment: number;      // 個人の投資額
    readonly teamInvestment: number;  // チーム全体の投資額
    readonly children: OrganizationTreeNode[];
}

// Member型も同様にキャメルケースに統一
export interface Member {
    id: string;
    display_id: string;
    name: string;
    name_kana?: string;  // オプショナルに
    email: string;
    display_name: string;
    level: string;  // 追加
    investment_amount: number;
    max_line_investment: number;
    other_lines_investment: number;
    total_team_investment: number;
    referrer_id: string | null;
    children: Member[];
}

// Member型からUserProfile型への変換関数を修正
export function memberToUserProfile(member: Member): OrganizationNode {
    return {
        id: member.id,
        displayId: member.display_id,
        name: member.name,
        email: member.email,
        nameKana: member.name_kana || '',
        investmentAmount: member.investment_amount,
        totalTeamInvestment: member.total_team_investment,
        maxLineInvestment: member.max_line_investment,
        otherLinesInvestment: member.other_lines_investment,
        level: member.level.toString(),
        referrerId: member.referrer_id,
        children: member.children?.map(child => memberToUserProfile(child)) || []
    };
}

// データベースからフロントエンドへの変換関数
export function transformDatabaseToFrontend(data: DatabaseSchema): OrganizationNode {
    return {
        id: data.id,
        displayId: data.display_id,
        name: data.name,
        email: data.email,
        nameKana: data.name_kana || '',
        investmentAmount: Number(data.investment_amount) || 0,
        totalTeamInvestment: Number(data.total_team_investment) || 0,
        maxLineInvestment: Number(data.max_line_investment) || 0,
        otherLinesInvestment: Number(data.other_lines_investment) || 0,
        level: data.level || '--',
        referrerId: data.referrer_id,
        children: []
    };
}

export interface UserOrganizationStats {
    id: string;
    user_id: string;
    week_start_date: string;
    max_line_amount: number | null;
    other_lines_total: number | null;
    level: string | null;
    created_at: string | null;
}

export interface User {
    id: string;
    user_id: string;
    name: string | null;
    name_kana: string;
    email: string;
    display_id: string | null;
    level: string | null;
    investment_amount: number | null;
    referrer_id: string | null;
    created_at: string;
    updated_at: string;
    user_organization_stats: UserOrganizationStats;
} 