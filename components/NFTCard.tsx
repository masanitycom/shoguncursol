import { format } from 'date-fns';
import { NFTOperationStatus } from '@/types/nft';
import { calculateNFTSchedule } from '@/types/nft';

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    price: number;
    daily_rate: number;
    purchase_date: string;
    reward_claimed?: boolean;
    image_url?: string;
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  const schedule = calculateNFTSchedule(new Date(nft.purchase_date));
  const now = new Date();

  const getOperationStatus = (): NFTOperationStatus => {
    if (now < schedule.operationStartDate) return '待機中';
    if (now >= schedule.rewardClaimStartDate && now <= schedule.rewardClaimEndDate) return '報酬申請可能';
    if (nft.reward_claimed) return '報酬申請済み';
    return '運用中';
  };

  const status = getOperationStatus();

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
          <p>日利: {(nft.daily_rate * 100).toFixed(2)}%</p>
          {status === '待機中' && (
            <p>運用開始まで: {Math.ceil((schedule.operationStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))}日</p>
          )}
        </div>
      </div>
    </div>
  );
} 