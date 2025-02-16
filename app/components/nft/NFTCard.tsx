import { NFTOperation, RewardStatus } from '@/app/types/RewardTypes';
import { formatDate, formatNumber } from '@/app/utils/format';
import { isWeekend } from '@/app/utils/nftOperations';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { NFT } from '@/app/types/nft';

interface NFTCardProps {
    nft: NFT;
    onStatusChange?: () => void;
}

// ステータスバッジの設定
const STATUS_CONFIG = {
    [RewardStatus.ACTIVE]: {
        color: 'bg-green-500',
        text: '運用中'
    },
    [RewardStatus.PENDING]: {
        color: 'bg-yellow-500',
        text: '承認待ち'
    },
    [RewardStatus.COMPLETED]: {
        color: 'bg-blue-500',
        text: '完了'
    },
    [RewardStatus.SUSPENDED]: {
        color: 'bg-red-500',
        text: '停止中'
    }
};

const StatusBadge: React.FC<{ status: RewardStatus }> = ({ status }) => {
    const config = STATUS_CONFIG[status] || {
        color: 'bg-gray-500',
        text: '不明'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs text-white ${config.color}`}>
            {config.text}
        </span>
    );
};

// 画像URLを生成する関数を追加
const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    // 余分なスラッシュを削除
    return imageUrl.replace(/([^:]\/)\/+/g, "$1");
};

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onStatusChange }) => {
    const dailyRate = nft.daily_rate ?? 0;

    // NFTのステータスを取得（デフォルトはACTIVE）
    const status = nft.status as RewardStatus || RewardStatus.ACTIVE;

    const canClaimReward = 
        status === RewardStatus.PENDING && 
        !isWeekend(new Date());

    const handlePurchase = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // ユーザー情報の取得
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('user_id', session.user.id)
                .single();

            if (userError) throw userError;

            const { error } = await supabase
                .from('nft_purchase_requests')
                .insert([
                    {
                        user_id: userData.id,  // public.usersテーブルのidを使用
                        nft_id: nft.id,
                        payment_method: 'usdt',
                        status: 'pending'
                    }
                ]);

            if (error) throw error;
            // 成功時の処理...
        } catch (error) {
            console.error('Error submitting purchase:', error);
            // エラー処理...
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="relative w-full pb-[50%] bg-gray-700">
                {nft.image_url ? (
                    <Image
                        src={getImageUrl(nft.image_url) || '/placeholder.png'}
                        alt={nft.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>
            
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{nft.name}</h3>
                    <StatusBadge status={status} />
                </div>

                {/* 投資情報と報酬情報を2カラムに分割 */}
                <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-700">
                    {/* 左カラム: 投資情報 */}
                    <div className="space-y-1.5 text-sm">
                        <div className="text-gray-400">投資情報</div>
                        <div className="text-gray-300">
                            投資額: {formatNumber(nft.purchaseAmount)} USDT
                        </div>
                        <div className="text-emerald-400">
                            日利: {dailyRate}%
                        </div>
                        <div className="text-gray-300">
                            購入日: {formatDate(nft.purchaseDate)}
                        </div>
                    </div>

                    {/* 右カラム: 報酬情報 */}
                    <div className="space-y-1.5 text-sm">
                        <div className="text-gray-400">報酬情報</div>
                        <div className="text-yellow-400">
                            累積報酬: {formatNumber(nft.accumulatedProfit)} USDT
                        </div>
                        {nft.lastClaimDate && (
                            <div className="text-gray-300">
                                前回申請: {formatDate(nft.lastClaimDate)}
                            </div>
                        )}
                        {nft.lastPaymentDate && (
                            <div className="text-gray-300">
                                前回支払: {formatDate(nft.lastPaymentDate)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 運用情報 */}
                <div className="space-y-1.5 text-sm">
                    <div className="text-blue-300">
                        運用開始予定日: {formatDate(nft.operationStartDate)}
                    </div>
                    {status === RewardStatus.PENDING && (
                        <>
                            <div className="text-yellow-400">
                                報酬申請可能期間: {formatDate(nft.nextClaimStartDate)} ～ {formatDate(nft.nextClaimEndDate)}
                            </div>
                            <div className="text-blue-400">
                                報酬支払予定日: {formatDate(nft.nextPaymentDate)}
                            </div>
                        </>
                    )}
                </div>

                {canClaimReward && (
                    <button 
                        className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors mt-2"
                        onClick={handlePurchase}
                    >
                        報酬を申請する
                    </button>
                )}
            </div>
        </div>
    );
}; 