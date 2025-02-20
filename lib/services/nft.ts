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
    lastWeekReward: number;
}

// 先週の日利報酬を計算する関数
export const calculateLastWeekReward = async (nftId: string, price: number, defaultDailyRate: number, purchaseDate: string) => {
    try {
        const operationStartDate = calculateNFTSchedule(new Date(purchaseDate)).operationStartDate;
        const targetStart = new Date('2025-02-10');
        const targetEnd = new Date('2025-02-14');

        console.log('Reward calculation parameters:', {
            nftId,
            price,
            defaultDailyRate,
            purchaseDate,
            operationStartDate: operationStartDate.toISOString(),
            targetStart: targetStart.toISOString(),
            targetEnd: targetEnd.toISOString()
        });

        // 運用開始前の場合は0を返す
        if (operationStartDate > targetEnd) {
            console.log('NFT operation check:', {
                operationStartDate: operationStartDate.toISOString(),
                targetEnd: targetEnd.toISOString(),
                comparison: operationStartDate > targetEnd,
                purchaseDate,
                nftId
            });
            return {
                totalReward: 0,
                dailyRewards: []
            };
        }

        const { data: dailyRates, error } = await supabase
            .from('daily_rates')
            .select('date, rate')
            .eq('nft_id', nftId)
            .gte('date', targetStart.toISOString().split('T')[0])
            .lte('date', targetEnd.toISOString().split('T')[0]);

        if (error) {
            console.error('Error fetching daily rates:', error);
            throw error;
        }

        console.log('Found daily rates:', dailyRates);

        let totalReward = 0;
        const weekDays = dailyRates?.map(rate => new Date(rate.date)) || [];

        weekDays.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const rateData = dailyRates?.find(rate => rate.date === dateStr);
            const dailyRate = rateData ? Number(rateData.rate) : defaultDailyRate;
            const reward = price * dailyRate;
            totalReward += reward;

            console.log('Daily calculation:', {
                date: dateStr,
                configuredRate: rateData?.rate,
                usedRate: dailyRate,
                reward: reward.toFixed(2)
            });
        });

        console.log('Final calculation:', {
            totalReward: totalReward.toFixed(2)
        });

        return {
            totalReward,
            dailyRewards: []
        };
    } catch (error) {
        console.error('Error calculating last week reward:', error);
        return {
            totalReward: 0,
            dailyRewards: []
        };
    }
};

export const fetchUserNFTs = async (userId: string): Promise<NFTWithReward[]> => {
    try {
        console.log('=== Start fetchUserNFTs ===');
        console.log('Fetching NFTs for user:', userId);
        
        const { data: nftData, error } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                nft_id,
                status,
                created_at,
                approved_at,
                nft_settings!inner (
                    id,
                    name,
                    price,
                    daily_rate,
                    image_url
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (error) {
            console.error('Error fetching NFTs:', error);
            throw error;
        }

        console.log('Raw NFT data:', JSON.stringify(nftData, null, 2));

        if (!nftData?.length) {
            console.log('No NFTs found');
            return [];
        }

        const nfts = await Promise.all(nftData.map(async (nft: any) => {
            console.log('\nProcessing NFT:', {
                id: nft.id,
                name: nft.nft_settings.name,
                purchaseDate: nft.approved_at || nft.created_at
            });

            const result = await calculateLastWeekReward(
                nft.nft_settings.id,
                Number(nft.nft_settings.price),
                Number(nft.nft_settings.daily_rate),
                nft.approved_at || nft.created_at
            );

            console.log('Reward calculation result:', result);

            return {
                id: nft.id,
                name: nft.nft_settings.name,
                price: Number(nft.nft_settings.price),
                daily_rate: Number(nft.nft_settings.daily_rate),
                purchase_date: nft.approved_at || nft.created_at,
                reward_claimed: false,
                image_url: nft.nft_settings.image_url || '/images/nft3000.png',
                lastWeekReward: Number(result.totalReward.toFixed(2))
            };
        }));

        console.log('=== End fetchUserNFTs ===\n');
        return nfts;

    } catch (error) {
        console.error('Error in fetchUserNFTs:', error);
        return [];
    }
}; 