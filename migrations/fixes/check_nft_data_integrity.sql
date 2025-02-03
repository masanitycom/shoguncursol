-- nft_settingsテーブルのデータを確認
SELECT * FROM nft_settings 
WHERE id IN (
    SELECT nft_id 
    FROM nft_purchase_requests 
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
);

-- 購入リクエストとNFT設定の結合を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    ns.id as settings_id,
    ns.name,
    ns.price,
    ns.daily_rate
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved';

-- データの移行が必要な場合
INSERT INTO nft_settings (
    id,
    name,
    price,
    daily_rate,
    created_at,
    updated_at
)
SELECT 
    n.id,
    n.name,
    n.price,
    COALESCE(n.daily_rate, 1.0),
    n.created_at,
    n.updated_at
FROM nfts n
WHERE n.id IN (
    SELECT nft_id 
    FROM nft_purchase_requests 
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_rate = EXCLUDED.daily_rate; 