'use client'

import React from 'react'
import { OrganizationNode } from '@/app/types/organization'

interface TreeChartProps {
    member: OrganizationNode
    isUserView?: boolean
}

export default function TreeChart({ member, isUserView = false }: TreeChartProps) {
    const formatAmount = (amount: number) => {
        return `$${amount.toLocaleString()} USDT`
    }

    const renderMember = (member: OrganizationNode) => {
        return (
            <div className="flex flex-col items-center">
                <div className="bg-gray-800 rounded-lg p-4 min-w-[200px] border border-blue-500">
                    <div className="text-white">
                        <div className="font-bold">{member.name}</div>
                        <div className="text-sm text-gray-400">{member.display_id}</div>
                        <div className="mt-2 text-sm">
                            <div>投資額: {formatAmount(member.investment_amount)}</div>
                            <div>最大系列: {formatAmount(member.max_line_investment)}</div>
                            <div>他系列: {formatAmount(member.other_lines_investment)}</div>
                        </div>
                    </div>
                </div>
                {member.children && member.children.length > 0 && (
                    <div className="mt-8 flex gap-8">
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
                )}
            </div>
        )
    }

    return (
        <div className="w-full min-w-full overflow-x-auto">
            <div className="min-w-max p-8 flex justify-center">
                {renderMember(member)}
            </div>
        </div>
    )
} 