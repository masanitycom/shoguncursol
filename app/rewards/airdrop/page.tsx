'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import { isBusinessDay } from '@/lib/services/nft-status-calculator'
import { calculateWeeklyProfit } from '@/lib/services/profit-calculator'
import { NFT } from '@/types/nft'

const MINIMUM_WITHDRAWAL = 50; // 最低出金額（ドル）

export default function AirdropPage() {
    const { user, handleLogout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentProfit, setCurrentProfit] = useState(0);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [disabledReason, setDisabledReason] = useState<string>('');
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [totalWeeklyProfit, setTotalWeeklyProfit] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchCurrentProfit(user.id);
        }
    }, [user]);

    const fetchCurrentProfit = async (userId: string) => {
        try {
            const fetchNFTs = async () => {
                try {
                    const { data: nftData, error } = await supabase
                        .from('nfts')
                        .select(`
                            nft_id,
                            user_id,
                            approved_at,
                            nft_settings:nft_settings_id(
                                id,
                                name,
                                price,
                                daily_rate,
                                status,
                                created_at,
                                updated_at
                            ),
                            status,
                            created_at,
                            updated_at
                        `)
                        .eq('user_id', userId)
                        .eq('status', 'active');

                    if (error) throw error;

                    // データを正しい形式に変換
                    const formattedNFTs: NFT[] = nftData.map(nft => {
                        // nft_settingsが配列の場合は最初の要素を使用
                        const settings = Array.isArray(nft.nft_settings) 
                            ? nft.nft_settings[0] 
                            : nft.nft_settings;

                        return {
                            nft_id: nft.nft_id,
                            user_id: nft.user_id,
                            approved_at: nft.approved_at,
                            nft_settings: {
                                id: settings.id,
                                name: settings.name,
                                price: settings.price,
                                daily_rate: settings.daily_rate,
                                status: settings.status,
                                created_at: settings.created_at,
                                updated_at: settings.updated_at
                            },
                            status: nft.status,
                            created_at: nft.created_at,
                            updated_at: nft.updated_at
                        };
                    });

                    setNfts(formattedNFTs);

                    // 利益の計算
                    let totalProfit = 0;
                    for (const nft of formattedNFTs) {
                        const profit = await calculateWeeklyProfit(
                            nft.nft_id,
                            nft.nft_settings.price,
                            new Date(nft.approved_at)
                        );
                        totalProfit += profit.totalProfit;
                    }

                    setTotalWeeklyProfit(totalProfit);
                } catch (error) {
                    console.error('Error fetching NFTs:', error);
                    setError('NFTデータの取得に失敗しました');
                }
            };

            if (user) {
                await fetchNFTs();
            }
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

        if (totalWeeklyProfit < MINIMUM_WITHDRAWAL) {
            setIsButtonDisabled(true);
            setDisabledReason(`報酬が最低出金額（${MINIMUM_WITHDRAWAL}ドル）に達していません`);
            return;
        }

        setIsButtonDisabled(false);
        setDisabledReason('');
    };

    useEffect(() => {
        checkAirdropAvailability();
    }, [totalWeeklyProfit]);

    const handleAirdropClaim = async () => {
        if (isButtonDisabled || !user) return;

        try {
            setLoading(true);
            
            // エアドロップタスクの作成
            const { error } = await supabase
                .from('airdrop_tasks')
                .insert({
                    user_id: user.id,
                    status: 'pending',
                    profit_amount: totalWeeklyProfit,
                    created_at: new Date().toISOString(),
                    profit_period_start: new Date().toISOString(), // 適切な期間を設定
                    profit_period_end: new Date().toISOString(),   // 適切な期間を設定
                    payment_date: new Date().toISOString()         // 支払予定日を設定
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
            <Header 
                user={user} 
                onLogout={handleLogout}
                profile={{
                    email: user?.email || '',
                    name: undefined
                }}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">エアドロップ申請</h1>

                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">現在の報酬</h2>
                            <p className="text-3xl font-bold text-green-400">
                                ${totalWeeklyProfit.toLocaleString()}
                            </p>
                        </div>

                        <button
                            onClick={handleAirdropClaim}
                            disabled={isButtonDisabled || loading || !user}
                            className={`w-full py-3 px-4 rounded-lg font-semibold
                                ${isButtonDisabled || !user
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