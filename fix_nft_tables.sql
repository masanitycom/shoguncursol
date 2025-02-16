-- 1. まず外部キー制約を確認
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'nft_operations';

-- 2. 既存の外部キー制約を削除
ALTER TABLE nft_operations
DROP CONSTRAINT IF EXISTS fk_nft;

-- 3. 新しい外部キー制約を追加
ALTER TABLE nft_operations
ADD CONSTRAINT fk_nft_master
FOREIGN KEY (nft_id) 
REFERENCES nft_master(id);

-- 4. テストデータを再度挿入
INSERT INTO nft_operations (
    id,
    user_id,
    nft_id,
    status,
    purchase_amount,
    current_profit,
    created_at,
    last_claim_date
) VALUES (
    gen_random_uuid(),
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33',  -- TEST001のユーザーID
    '68e4095a-b0a7-47a3-a3fe-13ff06e6a817',  -- SHOGUN NFT 100のID
    'active',
    100000,  -- 購入額（100万円）
    0,       -- 初期利益
    CURRENT_TIMESTAMP,
    NULL
);

-- 5. 挿入されたデータを確認
SELECT 
    no.id,
    p.display_id,
    nm.name as nft_name,
    no.status,
    no.purchase_amount,
    no.current_profit,
    no.created_at
FROM nft_operations no
JOIN profiles p ON no.user_id = p.user_id
JOIN nft_master nm ON no.nft_id = nm.id
WHERE p.display_id = 'TEST001'; 