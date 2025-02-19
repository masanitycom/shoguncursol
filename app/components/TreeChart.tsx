'use client'

import React from 'react'
import { UserProfile } from '@/types/user'
import { OrganizationNode, BaseNode } from '@/types/organization'
import { Member } from '@/types/organization'

type NodeType = UserProfile & BaseNode & {
    children: Array<UserProfile & BaseNode & {
        children: UserProfile[];
    }>;
    maxLineInvestment: number;
    otherLinesInvestment: number;
};

interface TreeChartProps {
    member: Member;
    depth?: number;
    maxDepth?: number;
    isUserView?: boolean;
}

// 型ガード関数
const isNodeType = (node: any): node is NodeType => {
    return 'maxLineInvestment' in node;
};

const memberToNode = (member: Member): OrganizationNode => {
    return {
        id: member.id,
        displayId: member.display_id,
        name: member.name,
        email: member.email,
        nameKana: member.name_kana,
        investmentAmount: member.investment_amount,
        totalTeamInvestment: member.total_team_investment,
        maxLineInvestment: member.maxLine || 0,
        otherLinesInvestment: member.otherLines || 0,
        level: member.level.toString(),
        referrerId: member.referrer_id,
        children: member.children.map(child => memberToNode(child))
    };
};

export const TreeChart: React.FC<TreeChartProps> = ({ 
    member, 
    depth = 0, 
    maxDepth = 3,
    isUserView = false 
}) => {
    const nodeData = memberToNode(member);
    
    const formatAmount = (amount: number) => {
        return `$${amount.toLocaleString()} USDT`;
    };

    const renderNode = (node: OrganizationNode) => {
        return (
            <div className="flex flex-col items-center">
                <div className={`bg-gray-800 rounded-lg p-4 min-w-[200px] border ${
                    isUserView ? 'border-green-500' : 'border-blue-500'
                }`}>
                    <div className="text-white">
                        <div className="font-bold">{node.name}</div>
                        <div className="text-sm text-gray-400">{node.displayId}</div>
                        <div className="mt-2 text-sm">
                            <div>投資額: {formatAmount(node.investmentAmount)}</div>
                            <div>最大系列: {formatAmount(node.maxLineInvestment)}</div>
                            <div>他系列: {formatAmount(node.otherLinesInvestment)}</div>
                        </div>
                    </div>
                </div>

                {node.children && node.children.length > 0 && (
                    <div className="mt-8 flex gap-8">
                        {node.children.map((child, index) => (
                            <div key={child.id} className="relative">
                                <div className="absolute top-[-2rem] left-1/2 w-px h-8 bg-blue-500"></div>
                                {node.children.length > 1 && index > 0 && (
                                    <div className="absolute top-[-2rem] left-[-2rem] w-4 h-px bg-blue-500"></div>
                                )}
                                {renderNode(child)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full overflow-auto">
            <div className="min-w-max p-8">
                {nodeData ? renderNode(nodeData) : <div>データがありません</div>}
            </div>
        </div>
    );
}; 