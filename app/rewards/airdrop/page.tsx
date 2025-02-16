'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { isBusinessDay } from '@/lib/services/nft-status-calculator'
import { calculateWeeklyProfit } from '@/lib/services/profit-calculator'

const MINIMUM_WITHDRAWAL = 50; // 最低出金額（ドル）

export default function AirdropPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [currentProfit, setCurrentProfit] = useState(0);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [disabledReason, setDisabledReason] = useState<string>('');

    useEffect(() => {
        checkAuth();
        checkAirdropAvailability();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = '/login';
            return;
        }
        setUser(session.user);
        await fetchCurrentProfit(session.user.id);
    };

    const fetchCurrentProfit = async (userId: string) => {
        try {
            // NFTと報酬情報を取得
            const { data: nfts, error } = await supabase
                .from('nft_purchase_requests')
                .select(`
                    id,
                    nft_id,
                    approved_at,
                    nft_settings (
                        price,
                        daily_rate
                    )
                `)
                .eq('user_id', userId)
                .eq('status', 'approved');

            if (error) throw error;

            // 各NFTの報酬を計算して合計
            let totalProfit = 0;
            for (const nft of nfts || []) {
                if (nft.approved_at && nft.nft_settings) {
                    const profit = await calculateWeeklyProfit(
                        nft.nft_id,
                        nft.nft_settings.price,
                        new Date(nft.approved_at)
                    );
                    totalProfit += profit.totalProfit;
                }
            }

            setCurrentProfit(totalProfit);
            setLoading(false);

        } catch (error) {
            console.error('Error fetching profit:', error);
            setLoading(false);
        }
    };

    const checkAirdropAvailability = () => {
        const today = new Date();
        const isWeekday = isBusinessDay(today);
        
        if (!isWeekday) {
            setIsButtonDisabled(true);
            setDisabledReason('エアドロップの申請は平日（月～金）のみ可能です');
            return;
        }

        if (currentProfit < MINIMUM_WITHDRAWAL) {
            setIsButtonDisabled(true);
            setDisabledReason(`報酬が最低出金額（${MINIMUM_WITHDRAWAL}ドル）に達していません`);
            return;
        }

        setIsButtonDisabled(false);
        setDisabledReason('');
    };

    useEffect(() => {
        checkAirdropAvailability();
    }, [currentProfit]);

    const handleAirdropClaim = async () => {
        if (isButtonDisabled) return;

        try {
            setLoading(true);
            
            // エアドロップタスクの作成
            const { error } = await supabase
                .from('airdrop_tasks')
                .insert({
                    user_id: user.id,
                    status: 'pending',
                    profit_amount: currentProfit
                });

            if (error) throw error;

            // 成功メッセージを表示
            alert('エアドロップの申請が完了しました');
            window.location.href = '/dashboard';

        } catch (error) {
            console.error('Error claiming airdrop:', error);
            alert('エアドロップの申請に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">エアドロップ申請</h1>

                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">現在の報酬</h2>
                            <p className="text-3xl font-bold text-green-400">
                                ${currentProfit.toLocaleString()}
                            </p>
                        </div>

                        <button
                            onClick={handleAirdropClaim}
                            disabled={isButtonDisabled || loading}
                            className={`w-full py-3 px-4 rounded-lg font-semibold
                                ${isButtonDisabled
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {loading ? '処理中...' : 'エアドロップを申請する'}
                        </button>

                        {disabledReason && (
                            <p className="mt-2 text-yellow-500 text-sm">
                                {disabledReason}
                            </p>
                        )}

                        <div className="mt-4 text-sm text-gray-400">
                            <h3 className="font-semibold mb-2">注意事項：</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>エアドロップの申請は平日（月～金）のみ可能です</li>
                                <li>最低出金額は{MINIMUM_WITHDRAWAL}ドルです</li>
                                <li>申請した報酬は翌週月曜日に反映されます</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
} 