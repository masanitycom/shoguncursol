export interface AirdropTask {
    id: string;
    user_id: string;
    status: 'pending' | 'completed' | 'expired';
    profit_amount: number;
    created_at: string;
    completed_at: string | null;
    profit_period_start: string;
    profit_period_end: string;
    payment_date: string;
} 