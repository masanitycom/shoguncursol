-- 1. 特定のユーザーのNFTデータを確認
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
WHERE no.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'  -- TEST001のユーザーID
ORDER BY no.created_at DESC;

-- 2. NFTマスターデータの確認
SELECT * FROM nft_master;

-- 3. テストデータの挿入（必要な場合）
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
    gen_random_uuid(),  -- 新しいUUID生成
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33',  -- TEST001のユーザーID
    (SELECT id FROM nft_master LIMIT 1),  -- 既存のNFT IDを使用
    'active',
    1000000,  -- 購入額
    0,        -- 初期利益
    CURRENT_TIMESTAMP,
    NULL
);

-- 4. 挿入後の確認
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