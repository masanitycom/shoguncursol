import React from 'react';
import { OrganizationMember } from '@/types/organization';

interface OrganizationTreeProps {
    data: OrganizationMember;
    level?: number;
}

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({ data }) => {
    const formatAmount = (amount: number) => {
        return `$${amount.toLocaleString()} USDT`;
    };

    const renderMember = (member: OrganizationMember) => {
        return (
            <div className="flex flex-col items-center">
                <div className="bg-gray-800 rounded-lg p-4 min-w-[200px] border border-blue-500">
                    <div className="text-white">
                        <div className="font-bold">{member.name}</div>
                        {member.displayId && (
                            <div className="text-sm text-gray-400">{member.displayId}</div>
                        )}
                        <div className="mt-2 text-sm">
                            <div>投資額: {formatAmount(member.investmentAmount)}</div>
                            <div>最大系列: {formatAmount(member.maxLineInvestment)}</div>
                            <div>他系列: {formatAmount(member.otherLinesInvestment)}</div>
                        </div>
                    </div>
                </div>
                {member.children && member.children.length > 0 && (
                    <div className="mt-8">
                        <div className="flex gap-8">
                            {member.children.map((child, index) => (
                                <div key={child.id} className="relative">
                                    {/* 縦線 */}
                                    <div className="absolute top-[-2rem] left-1/2 w-px h-8 bg-blue-500"></div>
                                    {/* 横線（最初と最後以外） */}
                                    {member.children.length > 1 && index > 0 && (
                                        <div className="absolute top-[-2rem] left-[-2rem] w-4 h-px bg-blue-500"></div>
                                    )}
                                    {renderMember(child)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8 overflow-auto">
            {renderMember(data)}
        </div>
    );
}; 