export async function generateDisplayId(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        // 6桁のランダムな数字を生成
        const randomNum = Math.floor(Math.random() * 1000000);
        const displayId = `USER${randomNum.toString().padStart(6, '0')}`;
        
        // display_idの重複チェック
        const { data, error } = await supabase
            .from('profiles')
            .select('display_id')
            .eq('display_id', displayId)
            .single();
            
        if (!data) {
            return displayId; // 重複がなければそのIDを使用
        }
        
        attempts++;
    }
    
    throw new Error('Could not generate unique display_id');
} 