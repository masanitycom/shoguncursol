import { useCallback, useState, useEffect, useMemo } from 'react'
import { UserIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Member } from '@/app/types/organization'

interface TreeChartProps {
    member: Member;
    depth?: number;
    maxDepth?: number;
    isUserView?: boolean;
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

// getLevelBadge関数をコンポーネントの外に移動
const getLevelBadge = (level: string): LevelBadge => {
    console.log('Getting badge for level:', level);
    switch (level?.toLowerCase()) {  // 小文字に変換して比較
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
    const [isExpanded, setIsExpanded] = useState(depth < 2)

    console.log('Member data:', {
        id: member.id,
        name: member.name,
        level: member.level,
        investment: member.investment_amount,
        total: member.total_team_investment
    });

    const hasChildren = member.children && member.children.length > 0

    const initializeLines = (member: Member): MemberWithLines => {
        return {
            ...member,
            maxLine: 0,
            otherLines: 0,
            children: member.children?.map(child => initializeLines(child)) || []
        }
    }

    const initializedMember = useMemo(() => initializeLines(member), [member])

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
    }, [initializedMember, calculateLines])

    // 型安全な表示用関数
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
                            <span className={`
                                px-2 py-1 rounded text-xs text-white
                                ${getLevelBadge(member.level.toString()).color}
                            `}>
                                {getLevelBadge(member.level.toString()).label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/80">
                                ${formatAmount(member.investment_amount)}
                            </span>
                            {hasChildren && (
                                <>
                                    <div className="text-gray-400">
                                        最大系列: <span className="text-white">${formatAmount(initializedMember.maxLine)}</span>
                                    </div>
                                    <div className="text-gray-400">
                                        他系列全体: <span className="text-white">${formatAmount(initializedMember.otherLines)}</span>
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
                            ${getLevelBadge(member.level.toString()).color}
                        `}>
                            {getLevelBadge(member.level.toString()).label}
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