import { supabase } from '@/lib/supabase';
import { startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import { calculateNFTSchedule } from '@/types/nft';

interface NFTPurchaseRequest {
    id: string;
    status: string;
    created_at: string;
    approved_at: string;
    nft_settings: {
        name: string;
        price: number;
        daily_rate: number;
        image_url?: string;
    };
}

// 戻り値の型を明示的に定義
interface NFTWithReward {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    purchase_date: string;
    reward_claimed: boolean;
    image_url: string;
    description?: string;
    status: string;
    approved_at: string | null;
    lastWeekReward: number;
    nft_master: {
        id: string;
        name: string;
        price: number;
        daily_rate: number;
        image_url?: string;
    };
}

// NFTの報酬を計算する関数
export const calculateNFTRewards = async (nft: NFTWithReward) => {
    try {
        // daily_ratesテーブルからデータ取得
        const { data: dailyRates, error } = await supabase
            .from('daily_rates')
            .select(`
                date,
                rate,
                nft_id
            `)
            .eq('nft_id', nft.nft_master.id)
            .gte('date', '2025-02-10')
            .lte('date', '2025-02-14')
            .order('date', { ascending: true });

        if (error) {
            console.error('日次レート取得エラー:', error);
            console.error('NFT情報:', {
                nft_id: nft.id,
                nft_master_id: nft.nft_master.id
            });
            return {
                ...nft,
                lastWeekReward: 0
            };
        }

        // デバッグ用のログ
        console.log('NFT情報:', {
            id: nft.id,
            nft_master_id: nft.nft_master.id,
            price: nft.nft_master.price,
            rates: dailyRates
        });

        if (!dailyRates || dailyRates.length === 0) {
            console.log('該当期間のレートデータがありません');
            return {
                ...nft,
                lastWeekReward: 0
            };
        }

        // 各日の報酬を計算して合計
        const totalReward = (dailyRates || []).reduce((total, rate) => {
            const dailyReward = nft.nft_master.price * Number(rate.rate);
            console.log(`
                日付: ${rate.date}
                レート: ${rate.rate}%
                NFT価格: $${nft.nft_master.price}
                日次報酬: $${dailyReward.toFixed(2)}
            `);
            return total + dailyReward;
        }, 0);

        const result = {
            ...nft,
            lastWeekReward: Number(totalReward.toFixed(2))
        };

        console.log('計算結果:', {
            nftId: nft.id,
            price: nft.nft_master.price,
            totalReward: result.lastWeekReward,
            dailyRates: dailyRates.map(r => ({
                date: r.date,
                rate: r.rate,
                reward: nft.nft_master.price * Number(r.rate)
            }))
        });

        return result;

    } catch (error) {
        console.error('報酬計算エラー:', error);
        return {
            ...nft,
            lastWeekReward: 0
        };
    }
};

// 先週の日利報酬を計算する関数
export const calculateLastWeekReward = async (nftId: string, price: number, defaultDailyRate: number, purchaseDate: string) => {
    try {
        // 購入日から2週間後を運用開始日とする
        const operationStartDate = new Date(purchaseDate);
        operationStartDate.setDate(operationStartDate.getDate() + 14);

        // 現在の週の月曜日と金曜日を取得
        const today = new Date();
        const monday = startOfWeek(today, { weekStartsOn: 1 });
        const friday = new Date(monday);
        friday.setDate(friday.getDate() + 4);

        // 運用開始前の場合は0を返す
        if (operationStartDate > friday) {
            console.log('Operation not started yet:', {
                operationStartDate: operationStartDate.toISOString(),
                friday: friday.toISOString(),
                purchaseDate
            });
            return {
                totalReward: 0,
                dailyRewards: []
            };
        }

        // daily_ratesテーブルからデータを取得
        const { data: rates, error } = await supabase
            .from('daily_rates')
            .select('*')
            .eq('nft_id', nftId)
            .gte('date', monday.toISOString().split('T')[0])
            .lte('date', friday.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching daily rates:', error);
            throw error;
        }

        console.log('Daily rates:', rates);

        // 日次報酬を計算
        let totalReward = 0;
        const dailyRewards = [];

        for (const rate of rates || []) {
            const dailyReward = (price * Number(rate.rate)) / 100;
            totalReward += dailyReward;
            dailyRewards.push({
                date: rate.date,
                reward: Number(dailyReward.toFixed(2))
            });
        }

        // デフォルトのレートを使用して不足分を補完
        const existingDates = new Set(rates?.map(r => r.date) || []);
        let currentDate = new Date(monday);
        while (currentDate <= friday) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (!existingDates.has(dateStr)) {
                const dailyReward = (price * defaultDailyRate) / 100;
                totalReward += dailyReward;
                dailyRewards.push({
                    date: dateStr,
                    reward: Number(dailyReward.toFixed(2))
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('Calculated rewards:', {
            totalReward,
            dailyRewards
        });

        return {
            totalReward: Number(totalReward.toFixed(2)),
            dailyRewards: dailyRewards.sort((a, b) => a.date.localeCompare(b.date))
        };
    } catch (error) {
        console.error('Error calculating last week reward:', error);
        return { totalReward: 0, dailyRewards: [] };
    }
};

export const fetchUserNFTs = async (userId: string): Promise<NFTWithReward[]> => {
    try {
        const { data: nftData, error } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                status,
                approved_at,
                created_at,
                nft_master!inner (
                    id,
                    name,
                    price,
                    daily_rate,
                    image_url
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) throw error;

        if (!nftData?.length) {
            console.log('No NFTs found');
            return [];
        }

        const nfts = await Promise.all(nftData.map(async (nft) => {
            const { data: dailyRates } = await supabase
                .from('daily_rates')
                .select('*')
                .eq('nft_id', nft.nft_master.id)
                .gte('date', '2025-02-10')
                .lte('date', '2025-02-14')
                .order('date', { ascending: true });

            // 報酬計算を修正
            const totalReward = (dailyRates || []).reduce((total, rate) => {
                const dailyReward = nft.nft_master.price * Number(rate.rate);
                console.log(`
                    日付: ${rate.date}
                    レート: ${rate.rate}%
                    NFT価格: $${nft.nft_master.price}
                    日次報酬: $${dailyReward.toFixed(2)}
                `);
                return total + dailyReward;
            }, 0);

            return {
                id: nft.id,
                name: nft.nft_master.name,
                price: nft.nft_master.price,
                daily_rate: nft.nft_master.daily_rate,
                purchase_date: nft.approved_at || nft.created_at,
                reward_claimed: false,
                image_url: nft.nft_master.image_url || '/images/nft3000.png',
                description: '',
                status: nft.status,
                approved_at: nft.approved_at,
                lastWeekReward: Number(totalReward.toFixed(2)),
                nft_master: nft.nft_master
            };
        }));

        return nfts;

    } catch (error) {
        console.error('Error in fetchUserNFTs:', error);
        return [];
    }
}; 