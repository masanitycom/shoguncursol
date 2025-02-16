import { NFTOperation, RewardStatus } from '@/app/types/RewardTypes';
import { formatDate, formatNumber } from '@/utils/format';
import { isWeekend } from '@/utils/nftOperations';

interface NFTCardProps {
    nft: NFTOperation;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
    const canClaimReward = 
        nft.status === RewardStatus.PENDING && 
        !isWeekend(new Date());

    return (
        <div className="bg-gray-800 rounded-lg p-6 space-y-4 border border-gray-700">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white">{nft.name}</h3>
                <StatusBadge status={nft.status} />
            </div>

            <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                    投資額: {formatNumber(nft.purchaseAmount)} USDT
                </div>
                <div className="text-emerald-400">
                    予想日利: {nft.dailyRate}%
                </div>
                <div className="text-gray-300">
                    購入日: {formatDate(nft.purchaseDate)}
                </div>
                <div className="text-blue-300">
                    運用開始予定日: {formatDate(nft.operationStartDate)}
                </div>
                {nft.status === RewardStatus.PENDING && (
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
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
                    onClick={() => {/* 報酬申請処理 */}}
                >
                    報酬を申請する
                </button>
            )}
        </div>
    );
};

// ステータスバッジコンポーネント
const StatusBadge = ({ status }: { status: RewardStatus }) => {
    const statusConfig = {
        [RewardStatus.WAITING]: { color: 'bg-gray-600', text: '運用待機中' },
        [RewardStatus.OPERATING]: { color: 'bg-emerald-600', text: '運用中' },
        [RewardStatus.PENDING]: { color: 'bg-yellow-600', text: '報酬申請可能' },
        [RewardStatus.CLAIMED]: { color: 'bg-green-600', text: '申請済み' },
        [RewardStatus.DISTRIBUTED]: { color: 'bg-purple-600', text: '報酬支払済み' },
        [RewardStatus.FAILED]: { color: 'bg-red-600', text: 'エラー' }
    };

    const config = statusConfig[status];
    return (
        <span className={`${config.color} text-white text-xs px-2 py-1 rounded-full`}>
            {config.text}
        </span>
    );
}; 