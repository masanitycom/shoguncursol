'use client'

import React from 'react'
import { OrganizationNode, NodeType } from '@/types/organization'

interface TreeChartProps {
    data?: OrganizationNode | NodeType;
    isUserView?: boolean;
}

export const TreeChart: React.FC<TreeChartProps> = ({ data, isUserView = false }) => {
    const renderNode = (node: OrganizationNode | NodeType | null) => {
        if (!node) return null;

        const displayName = isUserView ?
            node.displayId || node.id.slice(0, 8) :
            node.displayId || node.id;

        const children = node.children || [];

        return (
            <div className="flex flex-col items-center">
                <div className="bg-gray-800 rounded-lg p-4 min-w-[200px] border border-blue-500">
                    <div className="text-white">
                        <div className="font-bold">{node.name}</div>
                        <div className="text-sm text-gray-400">{displayName}</div>
                        <div className="mt-2 text-sm">
                            <div>投資額: ${node.investmentAmount.toLocaleString()}</div>
                            <div>最大系列: ${node.maxLineInvestment.toLocaleString()}</div>
                            <div>他系列: ${node.otherLinesInvestment.toLocaleString()}</div>
                            <div>チーム合計: ${node.totalTeamInvestment.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {children.length > 0 && (
                    <div className="mt-8">
                        <div className="flex gap-8">
                            {children.map((child, index) => (
                                <div key={child.id} className="relative">
                                    <div className="absolute top-[-2rem] left-1/2 w-px h-8 bg-gray-600" />
                                    {children.length > 1 && index > 0 && (
                                        <div className="absolute top-[-2rem] left-[-2rem] w-4 h-px bg-gray-600" />
                                    )}
                                    {renderNode(child as (OrganizationNode | NodeType))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full overflow-auto">
            <div className="min-w-max p-8">
                {data ? renderNode(data) : <div>データがありません</div>}
            </div>
        </div>
    );
}; 