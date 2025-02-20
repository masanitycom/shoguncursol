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
        level: string;  // この型が正しいか確認
        investment_amount: number;
        max_line_investment: number;
        other_lines_investment: number;
        children: any[];
    };
    depth: number;
    maxDepth: number;
    isUserView: boolean;
}

// 拡張されたMember型を定義
interface MemberWithLines extends Member {
    maxLine: number;
    otherLines: number;
}

// レベルバッジの型を定義
interface LevelBadge {
    color: string;
    label: string;
}

// getLevelBadge関数を修正
const getLevelBadge = (level: string): LevelBadge => {
    console.log('Getting badge for level:', level);
    switch (level?.toUpperCase()) {  // 大文字に変換して比較
        case 'SHOGUN':
            return { color: 'bg-red-600', label: '将軍' };
        case 'DAIMYO':
            return { color: 'bg-red-500', label: '大名' };
        case 'TAIRO':
            return { color: 'bg-red-400', label: '大老' };
        case 'ROJU':
            return { color: 'bg-orange-500', label: '老中' };
        case 'BUGYO':
            return { color: 'bg-orange-400', label: '奉行' };
        case 'DAIKAN':
            return { color: 'bg-yellow-500', label: '代官' };
        case 'BUSHO':
            return { color: 'bg-yellow-400', label: '武将' };
        case 'ASHIGARU':
            return { color: 'bg-green-500', label: '足軽' };
        case 'NONE':
            return { color: 'bg-gray-600', label: '--' };
        default:
            console.log('Unknown level:', level);
            return { color: 'bg-gray-600', label: '--' };
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

const TreeNode = ({ member }: { member: Member }) => {
    const hasChildren = member.children && member.children.length > 0;
    
    // 型安全な表示用関数
    const formatAmount = (amount: number | undefined | null): string => {
        if (amount === undefined || amount === null) return '0';
        return amount.toLocaleString();
    };

    return (
        <div className={`
            flex items-center gap-2 p-4 rounded-lg 
            bg-gray-700 border border-gray-600 hover:brightness-110 transition-all
        `}>
            <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-full">
                    <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="text-white font-bold">
                        {member.display_name || member.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/80">
                            ${formatAmount(member.investment_amount)}
                        </span>
                        <span className={`
                            px-2 py-1 rounded text-xs text-white
                            ${getLevelBadge(member.level || 'NONE').color}
                        `}>
                            {getLevelBadge(member.level || 'NONE').label}
                        </span>
                        {hasChildren && (
                            <span className="text-white/60">
                                紹介数: {member.children.length}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                        チーム投資額: ${formatAmount(member.total_team_investment)}
                    </div>
                </div>
            </div>
        </div>
    );
}; 