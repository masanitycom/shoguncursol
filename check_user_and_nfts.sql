-- 1. まずプロフィールテーブルからユーザー情報を取得
SELECT 
    user_id,
    display_id,
    email
FROM profiles
WHERE display_id = 'TEST001';

-- 2. 取得したuser_idを使用してNFT操作を確認
WITH user_info AS (
    SELECT user_id
    FROM profiles
    WHERE display_id = 'TEST001'
)
SELECT 
    no.id,
    no.user_id,
    no.nft_id,
    no.status,
    no.purchase_amount,
    no.current_profit,
    no.created_at,
    no.last_claim_date,
    p.display_id
FROM nft_operations no
JOIN profiles p ON no.user_id = p.user_id
WHERE no.user_id IN (SELECT user_id FROM user_info)
ORDER BY no.created_at DESC;

-- 3. テーブル構造の確認
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'nft_operations';

-- 4. 全てのNFT操作を確認（制限付き）
SELECT 
    no.id,
    p.display_id,
    no.status,
    no.purchase_amount,
    no.current_profit,
    no.created_at
FROM nft_operations no
JOIN profiles p ON no.user_id = p.user_id
ORDER BY no.created_at DESC
LIMIT 10; 