'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { Form, Input, Select, Button, message, Table } from 'antd'
import { useAuth } from '@/lib/auth'
import { WeeklyProfitSettings } from '@/types/profit'
import { calculateAndDistributeBonus } from '@/lib/services/profit'
import { CONQUEST_BONUS_RATES, RankLevel } from '@/types/reward'
import { determineUserLevel } from '@/lib/organization'
import { buildOrganizationTree } from '@/lib/organization'
import { fetchNFTData } from '@/lib/services/nft'

interface LevelCount {
    level: RankLevel;
    count: number;
}

export default function WeeklyProfitSettingsPage() {
    const router = useRouter()
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [preview, setPreview] = useState<{
        totalProfit: number;
        shareRate: number;
    } | null>(null)
    const [levelCounts, setLevelCounts] = useState<LevelCount[]>([])

    // レベルごとのユーザー数を取得
    useEffect(() => {
        const fetchLevelCounts = async () => {
            try {
                // 2. 関数名を修正
                const { users, nfts, tree } = await fetchNFTData();  // getNFTDataをfetchNFTDataに変更
                console.log('NFT data loaded:', { users, nfts, tree });

                // 2. レベル計算
                const userLevels = users.map(user => {
                    const userNFTs = nfts.filter(nft => 
                        nft.user_id === user.id &&
                        nft.status === 'approved' &&
                        new Date(nft.created_at) >= new Date('2024-02-10') &&
                        new Date(nft.created_at) <= new Date('2024-02-14')
                    );

                    const level = determineUserLevel({
                        nft_purchase_requests: userNFTs,
                        max_line_investment: user.max_line_investment || 0,
                        other_lines_investment: user.other_lines_investment || 0,
                        total_team_investment: user.total_team_investment || 0
                    });

                    return { level, display_id: user.display_id };
                });

                // 3. レベルごとの集計
                const counts = userLevels.reduce((acc, { level }) => {
                    if (level && level !== 'NONE') {
                        acc[level] = (acc[level] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<RankLevel, number>);

                setLevelCounts(Object.entries(CONQUEST_BONUS_RATES)
                    .filter(([level]) => level !== 'NONE')
                    .map(([level]) => ({
                        level: level as RankLevel,
                        count: counts[level as RankLevel] || 0
                    }))
                );
            } catch (error) {
                console.error('Error:', error);
                message.error('データの取得に失敗しました');
            }
        };

        fetchLevelCounts();
    }, []);

    // プレビューの計算を修正
    const distributionPreview = useMemo(() => {
        console.log('Current level counts:', levelCounts);  // 現在のレベル数を確認
        if (!preview) return [];

        const distributionPool = preview.totalProfit * (preview.shareRate / 100);
        
        return Object.entries(CONQUEST_BONUS_RATES)
            .filter(([level]) => level !== 'NONE')
            .map(([level, rate]) => {
                const userCount = levelCounts.find(l => l.level === level)?.count || 0;
                console.log(`Level ${level}: found ${userCount} users, rate ${rate}%`);  // 各レベルの計算を確認
                const amount = distributionPool * (rate / 100);
                const perUserAmount = userCount > 0 ? amount / userCount : 0;

                return {
                    key: level,
                    level,
                    profitShare: rate,
                    userCount,
                    amount,
                    perUserAmount
                };
            });
    }, [preview, levelCounts]);

    const handleValuesChange = (changedValues: any, allValues: any) => {
        console.log('Values changed:', { changedValues, allValues });
        if (allValues.totalProfit && allValues.shareRate) {
            const previewData = {
                totalProfit: Number(allValues.totalProfit),
                shareRate: Number(allValues.shareRate)
            };
            console.log('Setting preview:', previewData);
            setPreview(previewData);
        }
    }

    const handleSubmit = async (values: WeeklyProfitSettings) => {
        try {
            setLoading(true)

            // 1. 週次利益を登録
            const { data: weeklyProfit, error: profitError } = await supabase
                .from('weekly_profits')
                .insert({
                    week_start: values.weekStart,
                    week_end: values.weekEnd,
                    total_profit: values.totalProfit,
                    share_rate: values.shareRate,
                    distribution_amount: values.totalProfit * (values.shareRate / 100)
                })
                .select()
                .single()

            if (profitError) throw profitError

            // 2. 天下統一ボーナスを計算・登録
            const result = await calculateAndDistributeBonus(
                weeklyProfit.id,
                values.totalProfit,
                values.shareRate
            )

            if (!result.success) throw result.error

            message.success('週次利益を登録しました')
            router.push('/admin/weekly-profits/summary')
        } catch (error) {
            console.error('Error registering weekly profit:', error)
            message.error('登録に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'ランク',
            dataIndex: 'level',
            key: 'level',
            render: (value: RankLevel) => (
                <span className="text-white">{value}</span>
            )
        },
        {
            title: '分配率',
            dataIndex: 'profitShare',
            key: 'profitShare',
            render: (value: number) => (
                <span className="text-white">{value}%</span>
            )
        },
        {
            title: '対象者数',
            dataIndex: 'userCount',
            key: 'userCount',
            render: (value: number) => (
                <span className="text-white">{value}人</span>
            )
        },
        {
            title: '1人あたり',
            dataIndex: 'perUserAmount',
            key: 'perUserAmount',
            render: (value: number) => (
                <span className="text-white">${value.toLocaleString()}</span>
            )
        },
        {
            title: '分配額',
            dataIndex: 'amount',
            key: 'amount',
            render: (value: number) => (
                <span className="text-white">${value.toLocaleString()}</span>
            )
        }
    ]

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} onLogout={handleLogout} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-bold text-white mb-6">週次利益設定</h1>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-gray-800 rounded-lg p-6">
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                    onValuesChange={handleValuesChange}
                                    className="text-white"
                                >
                                    <Form.Item
                                        label={<span className="text-white">開始日</span>}
                                        name="weekStart"
                                        rules={[{ required: true, message: '開始日を入力してください' }]}
                                    >
                                        <Input 
                                            type="date" 
                                            className="h-12 w-full bg-gray-700 text-white border-gray-500 
                                                hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white" 
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="text-white">終了日</span>}
                                        name="weekEnd"
                                        rules={[{ required: true, message: '終了日を入力してください' }]}
                                    >
                                        <Input 
                                            type="date" 
                                            className="h-12 w-full bg-gray-700 text-white border-gray-500 hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white" 
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="text-white">総利益（USD）</span>}
                                        name="totalProfit"
                                        rules={[{ required: true, message: '総利益を入力してください' }]}
                                    >
                                        <Input 
                                            type="number" 
                                            min={0} 
                                            step="0.01" 
                                            className="h-12 w-full bg-gray-700 text-white border-gray-500 hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label={<span className="text-white">分配率（%）</span>}
                                        name="shareRate"
                                        rules={[{ required: true, message: '分配率を選択してください' }]}
                                    >
                                        <Select
                                            className="h-12 w-full text-white"
                                            popupClassName="bg-gray-700"
                                            style={{ backgroundColor: '#4b5563' }}
                                        >
                                            <Select.Option value={20}>20%</Select.Option>
                                            <Select.Option value={22}>22%</Select.Option>
                                            <Select.Option value={25}>25%</Select.Option>
                                            <Select.Option value={30}>30%</Select.Option>
                                        </Select>
                                    </Form.Item>

                                    <Form.Item className="mb-0">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                            className="w-full h-12"
                                        >
                                            登録する
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-white mb-4">分配プレビュー</h2>
                                {preview ? (
                                    <>
                                        <div className="mb-4 text-white">
                                            <p>総利益: ${preview.totalProfit.toLocaleString()}</p>
                                            <p>分配率: {preview.shareRate}%</p>
                                            <p>分配総額: ${(preview.totalProfit * preview.shareRate / 100).toLocaleString()}</p>
                                        </div>
                                        <Table 
                                            columns={columns} 
                                            dataSource={distributionPreview}
                                            pagination={false}
                                            className="preview-table"
                                            rowKey="key"
                                            style={{ 
                                                background: 'transparent',
                                                color: 'white'
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div className="text-gray-400 text-center py-8">
                                        総利益と分配率を入力すると、プレビューが表示されます
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 