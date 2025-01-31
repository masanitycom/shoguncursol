'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RewardCalculator } from '@/lib/services/reward-calculator';

export default function ProfitSharingPage() {
    const [loading, setLoading] = useState(false);
    const [weeklyProfit, setWeeklyProfit] = useState({
        total_profit: 0,
        week_start: '',
        week_end: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const shares = await RewardCalculator.calculateProfitSharing({
                totalProfit: weeklyProfit.total_profit,
                sharingAmount: weeklyProfit.total_profit * 0.2,
                weekStart: new Date(weeklyProfit.week_start),
                weekEnd: new Date(weeklyProfit.week_end)
            });

            // 分配金を保存
            await supabase.from('weekly_profit_sharing').insert({
                total_profit: weeklyProfit.total_profit,
                sharing_amount: weeklyProfit.total_profit * 0.2,
                week_start: weeklyProfit.week_start,
                week_end: weeklyProfit.week_end,
                shares: shares
            });

        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">週次利益分配設定</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">総利益</label>
                    <input
                        type="number"
                        value={weeklyProfit.total_profit}
                        onChange={(e) => setWeeklyProfit({
                            ...weeklyProfit,
                            total_profit: Number(e.target.value)
                        })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-2">週開始日</label>
                    <input
                        type="date"
                        value={weeklyProfit.week_start}
                        onChange={(e) => setWeeklyProfit({
                            ...weeklyProfit,
                            week_start: e.target.value
                        })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-2">週終了日</label>
                    <input
                        type="date"
                        value={weeklyProfit.week_end}
                        onChange={(e) => setWeeklyProfit({
                            ...weeklyProfit,
                            week_end: e.target.value
                        })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {loading ? '計算中...' : '分配金を計算・保存'}
                </button>
            </form>
        </div>
    );
} 