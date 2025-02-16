import { useCallback, useState, useEffect, useMemo } from 'react';
import { UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Member } from '@/app/types/organization';
import { formatDate } from '@/utils/format';

interface TreeChartProps {
    member: Member;
    depth?: number;
    maxDepth?: number;
    isUserView?: boolean;
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
    switch (level?.toLowerCase()) {
        case 'shogun':
            return { color: 'bg-red-600', label: '将軍' };
        case 'daimyo':
            return { color: 'bg-red-600', label: '大名' };
        case 'samurai':
            return { color: 'bg-red-600', label: '侍' };
        case 'ashigaru':
            return { color: 'bg-red-600', label: '足軽' };
        default:
            return { color: 'bg-gray-600', label: '--' };
    }
};

export const TreeChart: React.FC<TreeChartProps> = ({ 
    member, 
    depth = 0, 
    maxDepth = 3,
    isUserView = false 
}) => {
    const [isExpanded, setIsExpanded] = useState(depth < 2);
    const hasChildren = member.children && member.children.length > 0;

    const initializeLines = (member: Member): MemberWithLines => {
        return {
            ...member,
            maxLine: 0,
            otherLines: 0,
            children: member.children?.map(child => initializeLines(child)) || []
        }
    }

    const initializedMember = useMemo(() => initializeLines(member), [member]);

    const calculateLines = useCallback((member: Member) => {
        if (!member.children || member.children.length === 0) {
            member.maxLine = 0;
            member.otherLines = 0;
            return;
        }

        member.children.forEach(calculateLines);
        
        const childrenInvestments = member.children.map(child => 
            (child.investment_amount || 0) + (child.maxLine || 0)
        );

        member.maxLine = Math.max(...childrenInvestments);
        const totalChildInvestment = childrenInvestments.reduce((sum, inv) => sum + inv, 0);
        member.otherLines = totalChildInvestment - member.maxLine;
    }, []);

    useEffect(() => {
        calculateLines(initializedMember)
    }, [initializedMember, calculateLines]);

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
                            <span className="text-gray-400 text-sm">
                                ({member.display_id})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <span className="text-white/80">
                                ${formatAmount(member.investment_amount)}
                            </span>
                            {hasChildren && (
                                <span className="text-gray-400">
                                    チーム: ${formatAmount(member.total_team_investment)}
                                </span>
                            )}
                        </div>
                    </div>
                    {hasChildren && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 hover:bg-gray-700 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            )}
                        </button>
                    )}
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