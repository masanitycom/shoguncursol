'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { formatPrice } from '@/lib/utils'

// レベルの表示順と要件を定義
const LEVEL_REQUIREMENTS = {
    'SHOGUN': {
        name: '将軍',
        maxLine: 600000,
        otherLines: 500000,
        bonus: 2,
        description: '最大系列$600,000以上、他系列$500,000以上'
    },
    'DAIMYO': {
        name: '大名',
        maxLine: 300000,
        otherLines: 150000,
        bonus: 3,
        description: '最大系列$300,000以上、他系列$150,000以上'
    },
    'TAIRO': {
        name: '大老',
        maxLine: 100000,
        otherLines: 50000,
        bonus: 4,
        description: '最大系列$100,000以上、他系列$50,000以上'
    },
    'ROJU': {
        name: '老中',
        maxLine: 50000,
        otherLines: 25000,
        bonus: 5,
        description: '最大系列$50,000以上、他系列$25,000以上'
    },
    'BUGYO': {
        name: '奉行',
        maxLine: 10000,
        otherLines: 5000,
        bonus: 6,
        description: '最大系列$10,000以上、他系列$5,000以上'
    },
    'DAIKANN': {
        name: '代官',
        maxLine: 5000,
        otherLines: 2500,
        bonus: 10,
        description: '最大系列$5,000以上、他系列$2,500以上'
    },
    'BUSHO': {
        name: '武将',
        maxLine: 3000,
        otherLines: 1500,
        bonus: 25,
        description: '最大系列$3,000以上、他系列$1,500以上'
    },
    'ASHIGARU': {
        name: '足軽',
        maxLine: 1000,
        otherLines: 0,
        bonus: 45,
        description: '最大系列$1,000以上'
    }
} as const;

export default function ConquestProgress() {
    const [levelData, setLevelData] = useState<any[]>([]);

    useEffect(() => {
        fetchLevelData();
    }, []);

    const fetchLevelData = async () => {
        const { data: users } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                max_line_investment,
                other_lines_investment,
                nft_purchase_requests (
                    id,
                    status,
                    nft_settings (
                        price
                    )
                )
            `);

        // レベルごとのユーザー集計
        const levelCounts = {} as Record<string, any[]>;
        
        users?.forEach(user => {
            const hasRequiredNFT = user.nft_purchase_requests?.some(nft => 
                nft.status === 'approved' && 
                Number(nft.nft_settings.price) >= 1000
            );

            if (hasRequiredNFT) {
                const maxLine = Number(user.max_line_investment) || 0;
                const otherLines = Number(user.other_lines_investment) || 0;

                Object.entries(LEVEL_REQUIREMENTS).forEach(([level, req]) => {
                    if (maxLine >= req.maxLine && otherLines >= req.otherLines) {
                        if (!levelCounts[level]) {
                            levelCounts[level] = [];
                        }
                        levelCounts[level].push({
                            display_id: user.display_id,
                            maxLine,
                            otherLines
                        });
                    }
                });
            }
        });

        setLevelData(Object.entries(LEVEL_REQUIREMENTS).map(([level, req]) => ({
            level,
            ...req,
            users: levelCounts[level] || []
        })));
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold mb-8">天下統一への道</h1>
                
                <div className="space-y-6">
                    {levelData.map(level => (
                        <div key={level.level} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">{level.name}</h2>
                                    <p className="text-gray-600">{level.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold">
                                        ボーナス分配率: {level.bonus}%
                                    </div>
                                    <div className="text-gray-600">
                                        到達者: {level.users.length}人
                                    </div>
                                </div>
                            </div>

                            {level.users.length > 0 && (
                                <div className="mt-4">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-600">
                                                <th className="py-2">ユーザーID</th>
                                                <th className="py-2 text-right">最大系列投資額</th>
                                                <th className="py-2 text-right">他系列投資額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {level.users.map(user => (
                                                <tr key={user.display_id} className="border-t">
                                                    <td className="py-2">{user.display_id}</td>
                                                    <td className="py-2 text-right">
                                                        ${formatPrice(user.maxLine)}
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        ${formatPrice(user.otherLines)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 