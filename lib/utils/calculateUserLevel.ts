import { UserLevel, UserStats } from '@/lib/types/user';
import { calculateUserStats } from './userLevel';
import { LEVELS } from '@/lib/constants/levels';
import { supabase } from '@/lib/supabase';

// NFTの設定情報の型
interface NFTSettings {
    price: number;
    daily_rate: number;
    name: string;
}

// Supabaseのクエリ結果の型
interface NFTPurchaseRequest {
    id: string;
    user_id: string;
    nft_settings: NFTSettings;
}

export const calculateUserLevel = async (userId: string): Promise<UserLevel> => {
    try {
        // まずusersテーブルから現在の情報を取得
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, investment_amount, level')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }

        console.log('Current user data:', userData);

        // NFTの購入履歴から実際の投資額を計算
        const { data: nftData, error: nftError } = await supabase
            .from('nft_purchase_requests')
            .select(`
                id,
                user_id,
                nft_settings:nft_settings_id (
                    price,
                    daily_rate,
                    name
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'approved');

        if (nftError) {
            console.error('Error fetching NFT data:', nftError);
            throw nftError;
        }

        // 型アサーションを使用する前に、データの形を確認
        console.log('NFT Data:', nftData);

        // 投資額の計算（型アサーションを使用せずに直接計算）
        const personalInvestment = (nftData || []).reduce((sum: number, item: any) => {
            const price = Number(item.nft_settings?.price || 0);
            return sum + price;
        }, 0);

        // 統計情報を返す
        const stats: UserStats = {
            personalInvestment,
            maxLine: 0,  // 後で計算
            otherLines: 0,  // 後で計算
            teamInvestment: 0  // 後で計算
        };

        return {
            level: userData.level,
            stats
        };
    } catch (error) {
        console.error('Error in calculateUserLevel:', error);
        throw error;
    }
}; 