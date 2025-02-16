import { getJSTDate, calculateOperationStartDate } from '@/app/lib/format';
import { RewardStatus, NFTOperation } from '@/app/types/RewardTypes';

interface NFTOperation {
    id: string;
    nft_id: string;
    user_id: string;
    status: 'waiting' | 'active' | 'completed' | 'suspended';
    purchase_amount: number;
    current_profit: number;
    profit_percentage: number;
    purchase_date: Date;
    operation_start_date: Date;
    suspended_at?: Date;
}

export async function createNFTOperation(
    nftId: string,
    userId: string,
    purchaseAmount: number
) {
    const purchaseDate = getJSTDate();
    const operationStartDate = calculateOperationStartDate(purchaseDate);

    const { data, error } = await supabase
        .from('nft_operations')
        .insert({
            nft_id: nftId,
            user_id: userId,
            status: 'waiting',
            purchase_amount: purchaseAmount,
            current_profit: 0,
            profit_percentage: 0,
            purchase_date: purchaseDate.toISOString(),
            operation_start_date: operationStartDate.toISOString(),
            created_at: purchaseDate.toISOString(),
            updated_at: purchaseDate.toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateNFTOperationStatus(
    nftId: string,
    newStatus: NFTOperation['status'],
    reason?: string
) {
    const now = getJSTDate();

    const { data, error } = await supabase
        .from('nft_operations')
        .update({
            status: newStatus,
            suspended_at: newStatus === 'suspended' ? now.toISOString() : null,
            suspension_reason: reason,
            updated_at: now.toISOString()
        })
        .eq('nft_id', nftId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function suspendNFTOperation(
    nftId: string,
    reason: string
) {
    const { data, error } = await supabase
        .from('nft_operations')
        .update({
            status: 'suspended',
            suspended_at: new Date(),
            suspension_reason: reason,
            updated_at: new Date()
        })
        .eq('nft_id', nftId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// 運用状況を計算する関数
export function calculateNFTOperationStatus(
    purchaseDate: Date,
    dailyRate: number
): Partial<NFTOperation> {
    const jstNow = getJSTDate();
    const operationStartDate = new Date(purchaseDate);
    operationStartDate.setDate(operationStartDate.getDate() + 14); // 2週間後

    // 次回の報酬申請期間と支払日を計算
    const nextClaimStartDate = calculateNextClaimStartDate(operationStartDate);
    const nextClaimEndDate = calculateNextClaimEndDate(nextClaimStartDate);
    const nextPaymentDate = calculateNextPaymentDate(nextClaimEndDate);

    // ステータスを判定
    let status = RewardStatus.WAITING;
    if (jstNow >= operationStartDate) {
        status = RewardStatus.OPERATING;
        if (jstNow >= nextClaimStartDate && jstNow <= nextClaimEndDate) {
            status = RewardStatus.PENDING;
        }
    }

    return {
        operationStartDate,
        nextClaimStartDate,
        nextClaimEndDate,
        nextPaymentDate,
        status,
        accumulatedProfit: 0, // 実際の累積報酬は別途計算が必要
    };
}

// 次回の報酬申請開始日を計算（月曜日）
function calculateNextClaimStartDate(operationStartDate: Date): Date {
    const date = new Date(operationStartDate);
    while (date.getDay() !== 1) { // 1は月曜日
        date.setDate(date.getDate() + 1);
    }
    return date;
}

// 次回の報酬申請終了日を計算（金曜日）
function calculateNextClaimEndDate(claimStartDate: Date): Date {
    const date = new Date(claimStartDate);
    date.setDate(date.getDate() + 4); // 月曜から4日後が金曜
    return date;
}

// 次回の支払予定日を計算（翌週月曜）
function calculateNextPaymentDate(claimEndDate: Date): Date {
    const date = new Date(claimEndDate);
    date.setDate(date.getDate() + 3); // 金曜から3日後が翌週月曜
    return date;
}

// 土日かどうかを判定
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0は日曜、6は土曜
} 