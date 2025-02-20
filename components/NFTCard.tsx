import { format } from 'date-fns';
import { NFTOperationStatus } from '@/types/nft';
import { calculateNFTSchedule } from '@/types/nft';
import { useMemo } from 'react';

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    purchase_date: string;
    reward_claimed?: boolean;
    image_url?: string;
    lastWeekReward: number;
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  const schedule = useMemo(() => calculateNFTSchedule(new Date(nft.purchase_date)), [nft.purchase_date]);
  const now = new Date();

  const status = useMemo(() => {
    if (now < schedule.operationStartDate) return '待機中';
    if (now >= schedule.rewardClaimStartDate && now <= schedule.rewardClaimEndDate) return '報酬申請可能';
    if (nft.reward_claimed) return '報酬申請済み';
    return '運用中';
  }, [now, schedule, nft.reward_claimed]);

  // 報酬の表示用フォーマット
  const formattedReward = useMemo(() => {
    if (typeof nft.lastWeekReward === 'number') {
      return nft.lastWeekReward.toFixed(2);
    }
    return '0.00';
  }, [nft.lastWeekReward]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="aspect-w-1 aspect-h-1">
        <img
          src={nft.image_url || '/images/nft3000.png'}
          alt={nft.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-white">{nft.name}</h3>
          <div className={`px-2 py-1 rounded text-sm ${
            status === '運用中' ? 'bg-green-600' :
            status === '待機中' ? 'bg-yellow-600' :
            status === '報酬申請可能' ? 'bg-blue-600' :
            'bg-gray-600'
          }`}>
            {status}
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          <p>購入日: {format(new Date(nft.purchase_date), 'yyyy/MM/dd')}</p>
          <p>運用開始日: {format(schedule.operationStartDate, 'yyyy/MM/dd')}</p>
          <p>日利上限: {(nft.daily_rate * 100).toFixed(2)}%</p>
          <p>先週の報酬: ${formattedReward}</p>
          {status === '待機中' && (
            <p>運用開始まで: {Math.ceil((schedule.operationStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}日</p>
          )}
        </div>
      </div>
    </div>
  );
} 