'use client'

import React from 'react';
import { OrganizationNode } from '@/types/organization';
import { useCallback, useState, useEffect, useMemo } from 'react'
import { UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Member } from '@/types/organization'

interface TreeChartProps {
    member: {
        id: string;
        display_id: string;
        name: string;
        level: string;
        investment_amount: number;
        max_line_investment: number;
        other_lines_investment: number;
        children: any[];
    };
    depth: number;
    maxDepth: number;
    isUserView: boolean;
}

interface MemberWithLines extends Member {
    maxLine: number;
    otherLines: number;
}

interface LevelBadge {
    color: string;
    label: string;
}

const getLevelBadge = (level: string): LevelBadge => {
    switch (level?.toUpperCase()) {
        case 'SHOGUN':
            return { color: 'bg-red-600', label: '将軍' };
        case 'DAIMYO':
            return { color: 'bg-yellow-600', label: '大名' };
        case 'TAIRO':
            return { color: 'bg-orange-600', label: '大老' };
        case 'ROJU':
            return { color: 'bg-green-600', label: '老中' };
        case 'BUGYO':
            return { color: 'bg-blue-600', label: '奉行' };
        case 'DAIKAN':
            return { color: 'bg-purple-600', label: '代官' };
        case 'BUSHO':
            return { color: 'bg-pink-600', label: '武将' };
        case 'ASHIGARU':
            return { color: 'bg-gray-600', label: '足軽' };
        default:
            return { color: 'bg-gray-400', label: '--' };
    }
};

export const TreeChart: React.FC<TreeChartProps> = ({ member, depth, maxDepth, isUserView }) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2)
    const hasChildren = member.children && member.children.length > 0

    const formatAmount = (amount: number | undefined | null): string => {
        if (amount === undefined || amount === null) return '0';
        return amount.toLocaleString();
    };

    return (
        <div className="relative">
            <div className={`
                bg-gray-800 rounded-lg p-4 mb-4
                ${depth === 0 ? 'border-2 border-blue-500' : ''}
            `}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                                {member.name}
                            </span>
                            <span className="text-sm text-gray-400">
                                {member.display_id || ''}
                            </span>
                            <span className={`
                                px-2 py-1 rounded text-xs text-white
                                ${getLevelBadge(member.level || 'NONE').color}
                            `}>
                                {getLevelBadge(member.level || 'NONE').label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/80">
                                ${formatAmount(member.investment_amount)}
                            </span>
                            {hasChildren && (
                                <>
                                    <div className="text-gray-400">
                                        最大系列: <span className="text-white">${formatAmount(member.max_line_investment)}</span>
                                    </div>
                                    <div className="text-gray-400">
                                        他系列全体: <span className="text-white">${formatAmount(member.other_lines_investment)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-8 mt-4 pl-4 border-l border-gray-700 space-y-4">
                    {member.children.map((child) => (
                        <TreeChart
                            key={child.id}
                            member={child}
                            depth={depth + 1}
                            maxDepth={maxDepth}
                            isUserView={isUserView}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TreeChart; 