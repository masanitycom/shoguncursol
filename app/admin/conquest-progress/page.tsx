'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { formatPrice } from '@/lib/utils'
import { 
    LEVEL_ORDER, 
    LEVEL_REQUIREMENTS, 
    CONQUEST_BONUS_RATES,
    LEVEL_NAMES 
} from '@/lib/services/weekly-profit'

interface NFTSettingsResponse {
    price: number;
}

interface NFTPurchaseRequestResponse {
    id: string;
    status: string;
    nft_settings: NFTSettingsResponse;
}

interface UserResponse {
    id: string;
    display_id: string;
    name: string;
    max_line_investment: number;
    other_lines_investment: number;
    nft_purchase_requests: NFTPurchaseRequestResponse[];
}

interface User {
    id: string;
    display_id: string;
    name: string;
    max_line_investment: number;
    other_lines_investment: number;
    nft_purchase_requests: NFTPurchaseRequestResponse[];
}

interface LevelData {
    level: string;
    name: string;
    maxLine: number;
    otherLines: number;
    bonus: number;
    description: string;
    users: User[];
}

export default function ConquestProgress() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [levelData, setLevelData] = useState<LevelData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLevelData();
    }, []);

    const fetchLevelData = async () => {
        try {
            setLoading(true);
            const { data: users, error } = await supabase
                .from('profiles')
                .select<string, UserResponse>(`
                    id,
                    display_id,
                    name,
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

            if (error) throw error;

            // レベルごとのユーザー集計
            const levelCounts = {} as Record<string, User[]>;
            
            users?.forEach(user => {
                const hasRequiredNFT = user.nft_purchase_requests?.some(nft => 
                    nft.status === 'approved' && 
                    nft.nft_settings.price >= 1000
                );

                if (hasRequiredNFT) {
                    const maxLine = Number(user.max_line_investment) || 0;
                    const otherLines = Number(user.other_lines_investment) || 0;

                    // 最上位のレベルから判定し、条件を満たしたレベルのみに登録
                    let assignedLevel = false;
                    for (const [level, req] of Object.entries(LEVEL_REQUIREMENTS)) {
                        if (!assignedLevel && maxLine >= req.maxLine && otherLines >= req.otherLines) {
                            if (!levelCounts[level]) {
                                levelCounts[level] = [];
                            }
                            levelCounts[level].push({
                                id: user.id,
                                display_id: user.display_id,
                                name: user.name,
                                max_line_investment: maxLine,
                                other_lines_investment: otherLines,
                                nft_purchase_requests: user.nft_purchase_requests || []
                            });
                            assignedLevel = true;
                            break;  // 一つのレベルにのみ割り当て
                        }
                    }
                }
            });

            // データの型を明示的に指定
            const data = Object.entries(LEVEL_REQUIREMENTS).map(([level, req]) => ({
                level,
                name: LEVEL_NAMES[level as keyof typeof LEVEL_NAMES],
                maxLine: req.maxLine,
                otherLines: req.otherLines,
                bonus: CONQUEST_BONUS_RATES[level as keyof typeof CONQUEST_BONUS_RATES],
                description: `最大系列$${formatPrice(req.maxLine)}以上、他系列$${formatPrice(req.otherLines)}以上`,
                users: levelCounts[level] || []
            }));

            setLevelData(data);
        } catch (error) {
            console.error('Error fetching level data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">天下統一への道</h1>
                        
                        <div className="space-y-6">
                            {levelData.map(level => (
                                <div key={level.level} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                                    <div className="p-4 border-b border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-base font-bold text-white flex items-center">
                                                    {level.name}
                                                    <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs rounded-full">
                                                        {level.users.length}人
                                                    </span>
                                                </h2>
                                                <p className="text-sm text-gray-400 mt-0.5">{level.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-white">
                                                    ボーナス分配率: <span className="font-bold">{level.bonus}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {level.users.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-700">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-gray-300">ユーザーID</th>
                                                        <th className="px-4 py-2 text-left text-gray-300">名前</th>
                                                        <th className="px-4 py-2 text-right text-gray-300">最大系列投資額</th>
                                                        <th className="px-4 py-2 text-right text-gray-300">他系列投資額</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-700">
                                                    {level.users.map(user => (
                                                        <tr key={user.display_id} className="hover:bg-gray-750">
                                                            <td className="px-4 py-2 text-gray-300">{user.display_id}</td>
                                                            <td className="px-4 py-2 text-gray-300">{user.name}</td>
                                                            <td className="px-4 py-2 text-right text-gray-300">
                                                                ${formatPrice(user.max_line_investment)}
                                                            </td>
                                                            <td className="px-4 py-2 text-right text-gray-300">
                                                                ${formatPrice(user.other_lines_investment)}
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
                </main>
            </div>
        </div>
    );
} 