import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateUniqueDisplayId(): Promise<string> {
    const prefix = 'USER';
    const length = 8;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        // ランダムな英数字を生成
        const randomPart = Array.from(
            { length },
            () => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
        ).join('');

        const displayId = `${prefix}${randomPart}`;

        // 重複チェック
        const { data, error } = await supabase
            .from('profiles')
            .select('display_id')
            .eq('display_id', displayId)
            .single();

        if (!data && !error) {
            return displayId;
        }

        attempts++;
    }

    throw new Error('Failed to generate unique display_id');
}

export async function isEmailUnique(email: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

    if (error && error.code === 'PGRST116') {
        return true; // メールアドレスが見つからない = ユニーク
    }

    return false; // メールアドレスが既に存在する
} 