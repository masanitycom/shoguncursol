import { OrganizationTreeNode } from '@/types/organization';

export function buildOrganizationTree(data: any[]): OrganizationTreeNode[] {
    const nodeMap = new Map<string, OrganizationTreeNode>();
    const rootNodes: OrganizationTreeNode[] = [];

    // まず全てのノードを作成
    data.forEach(user => {
        nodeMap.set(user.id, {
            id: user.id,
            displayId: user.display_id || user.id.slice(0, 8),
            name: user.name || 'Unknown',
            email: user.email || '',
            nameKana: user.name_kana || '',
            investmentAmount: Number(user.investment_amount) || 0,
            totalTeamInvestment: Number(user.total_team_investment) || 0,
            maxLineInvestment: Number(user.max_line_investment) || 0,
            otherLinesInvestment: Number(user.other_lines_investment) || 0,
            level: user.level || '--',
            referrerId: user.referrer_id,
            investment: Number(user.investment_amount) || 0,
            teamInvestment: 0, // 初期値として0を設定
            children: []
        });
    });

    // 階層構造を構築
    data.forEach(user => {
        if (user.referrer_id) {
            const parentNode = nodeMap.get(user.referrer_id);
            const currentNode = nodeMap.get(user.id);
            if (parentNode && currentNode) {
                parentNode.children.push(currentNode);
            }
        } else {
            const node = nodeMap.get(user.id);
            if (node) {
                rootNodes.push(node);
            }
        }
    });

    // チーム投資額を計算して新しいノードを作成
    function calculateTeamInvestment(node: OrganizationTreeNode): OrganizationTreeNode {
        const childrenWithInvestments = node.children.map(calculateTeamInvestment);
        const childrenInvestment = childrenWithInvestments.reduce(
            (sum, child) => sum + child.teamInvestment,
            0
        );

        return {
            ...node,
            children: childrenWithInvestments,
            teamInvestment: node.investmentAmount + childrenInvestment
        };
    }

    // ルートノードを更新
    const updatedRootNodes = rootNodes.map(calculateTeamInvestment);

    return updatedRootNodes;
}

export function flattenOrganizationTree(node: OrganizationTreeNode): OrganizationTreeNode[] {
    return [node, ...node.children.flatMap(flattenOrganizationTree)];
} 