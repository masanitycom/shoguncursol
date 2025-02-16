import { calculateOperationDates } from '@/lib/utils/dateCalculations';
import { format } from 'date-fns';

// NFTの運用開始日を計算
const operationStartDate = calculateOperationDates(new Date(nft.purchase_date)).operationStartDate;

// 表示用のフォーマット
const formattedStartDate = format(operationStartDate, 'yyyy/MM/dd'); 