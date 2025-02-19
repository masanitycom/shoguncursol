import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OrganizationNode } from '@/types/organization';
import { fetchUserLevelInfo, calculateUserLevel } from '@/lib/utils/calculateUserLevel';
import { UserLevelParams } from '@/types/user';

interface ProfileData {
    id: string;
    user_id: string;
    name: string | null;
    email: string | null;
    investment_amount: number | null;
    total_team_investment: number | null;
    max_line_investment: number | null;
    other_lines_investment: number | null;
    referrer_id: string | null;
}

function transformProfileToNode(profile: any): OrganizationNode {
    const params: UserLevelParams = {
        personalInvestment: Number(profile.investment_amount) || 0,
        maxLine: Number(profile.max_line_investment) || 0,
        otherLines: Number(profile.other_lines_investment) || 0
    };
    const level = calculateUserLevel(params);

    return {
        id: profile.id,
        displayId: profile.display_id || profile.id.slice(0, 8),
        name: profile.name || profile.email || 'Unknown',
        email: profile.email || '',
        nameKana: profile.name_kana || '',
        investmentAmount: Number(profile.investment_amount) || 0,
        totalTeamInvestment: Number(profile.total_team_investment) || 0,
        maxLineInvestment: Number(profile.max_line_investment) || 0,
        otherLinesInvestment: Number(profile.other_lines_investment) || 0,
        level: level || '--',
        referrerId: profile.referrer_id,
        children: []
    };
}

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // プロフィール情報を取得（SQLクエリのカラム名はスネークケースのまま）
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                name,
                name_kana,
                email,
                display_id,
                level,
                investment_amount,
                total_team_investment,
                max_line_investment,
                other_lines_investment,
                referrer_id
            `);

        if (error) throw error;

        // 各プロフィールをノードに変換
        const nodes = profiles.map(transformProfileToNode);
        
        // データ構造を構築
        const organizationMap = new Map<string, OrganizationNode>();
        const rootNodes: OrganizationNode[] = [];

        // プロフィールをマップに追加
        nodes.forEach(node => {
            organizationMap.set(node.id, node);
        });

        // 階層構造を構築
        nodes.forEach(node => {
            if (node.referrerId) {
                const parentNode = organizationMap.get(node.referrerId);
                if (parentNode) {
                    // 新しい配列を作成して子ノードを追加
                    const updatedParentNode: OrganizationNode = {
                        ...parentNode,
                        children: [...parentNode.children, node]
                    };
                    organizationMap.set(node.referrerId, updatedParentNode);
                }
            } else {
                rootNodes.push(node);
            }
        });

        return NextResponse.json(rootNodes);

    } catch (error) {
        console.error('Error fetching organization:', error);
        return NextResponse.json(
            { error: '組織図の取得中にエラーが発生しました' },
            { status: 500 }
        );
    }
} 