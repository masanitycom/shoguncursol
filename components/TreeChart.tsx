'use client'

import React from 'react'
import { UserProfile } from '@/app/types/user'

interface TreeChartProps {
    data: UserProfile
}

export default function TreeChart({ data }: TreeChartProps) {
    const renderNode = (node: UserProfile | null) => {
        if (!node) return null

        return (
            <div className="relative">
                <div className="flex flex-col items-center">
                    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white mb-4">
                        <div className="font-bold">{node.display_id}</div>
                        <div className="text-sm text-gray-400">{node.name}</div>
                    </div>
                    {node.children && node.children.length > 0 && (
                        <div className="flex gap-8 relative">
                            {/* 子ノードを接続する線 */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-600" />
                            <div className="flex gap-8">
                                {node.children.map((child, index) => (
                                    <div key={child.id || index} className="relative">
                                        {/* 横線 */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-gray-600" />
                                        {renderNode(child)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full overflow-auto">
            <div className="min-w-max p-8">
                {data ? renderNode(data) : <div>データがありません</div>}
            </div>
        </div>
    )
} 