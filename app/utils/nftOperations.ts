import { getJSTDate, calculateOperationStartDate } from '@/app/lib/format';
import { RewardStatus, NFTOperation, NFTOperationStatus } from '@/app/types/RewardTypes';
import { supabase } from '@/lib/supabase';

export async function createNFTOperation(
    nftId: string,
    userId: string,
    operationType: 'purchase' | 'transfer' | 'sale',
    amount: number
): Promise<NFTOperation> {
    const now = getJSTDate();
    const startDate = calculateOperationStartDate(now);

    const { data, error } = await supabase
        .from('nft_operations')
        .insert({
            nft_id: nftId,
            user_id: userId,
            operation_type: operationType,
            status: 'pending',
            amount,
            created_at: now,
            updated_at: now,
            start_date: startDate,
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        nftId: data.nft_id,
        userId: data.user_id,
        operationType: data.operation_type,
        status: data.status,
        amount: data.amount,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        startDate: data.start_date,
        endDate: data.end_date,
    };
}

export async function updateNFTOperationStatus(
    nftId: string,
    newStatus: RewardStatus,
    reason?: string
) {
    const now = getJSTDate();

    const { data, error } = await supabase
        .from('nft_operations')
        .update({
            status: newStatus,
            suspended_at: newStatus === RewardStatus.SUSPENDED ? now.toISOString() : null,
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
            status: RewardStatus.SUSPENDED,
            suspended_at: new Date().toISOString(),
            suspension_reason: reason,
            updated_at: new Date().toISOString()
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
): NFTOperationStatus {
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