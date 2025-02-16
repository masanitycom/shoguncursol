-- 1. 現在のテーブル構造を確認
SELECT 
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'nft_purchase_requests'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. 必要な外部キー制約を追加
ALTER TABLE nft_purchase_requests
ADD CONSTRAINT nft_purchase_requests_user_id_fkey2
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- 3. リレーションシップの確認
SELECT * FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.user_id
LIMIT 1; 