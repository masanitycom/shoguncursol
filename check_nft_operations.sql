-- 1. nft_operationsテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'nft_operations';

-- 2. 特定のユーザーのNFTデータを確認
SELECT 
    no.id,
    no.user_id,
    no.nft_id,
    no.status,
    no.purchase_amount,
    no.current_profit,
    nm.name as nft_name,
    nm.price as base_price,
    nm.daily_rate,
    no.created_at
FROM nft_operations no
JOIN nft_master nm ON no.nft_id = nm.id
WHERE no.user_id = 'あなたのユーザーID'
ORDER BY no.created_at DESC;

-- 3. アクティブなNFTの数を確認
SELECT 
    status,
    COUNT(*) as count
FROM nft_operations
GROUP BY status;

-- 4. ユーザーごとのNFT所有数を確認
SELECT 
    p.display_id,
    p.email,
    COUNT(no.id) as nft_count,
    SUM(no.purchase_amount) as total_investment
FROM profiles p
LEFT JOIN nft_operations no ON p.user_id = no.user_id
WHERE no.status = 'active'
GROUP BY p.display_id, p.email
HAVING COUNT(no.id) > 0;

-- 5. 不正なデータがないか確認
SELECT *
FROM nft_operations no
WHERE 
    no.nft_id NOT IN (SELECT id FROM nft_master)
    OR no.user_id NOT IN (SELECT user_id FROM profiles)
    OR no.status NOT IN ('active', 'completed', 'suspended'); 