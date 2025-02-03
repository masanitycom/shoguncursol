-- 既存のNFTデータを確認
SELECT * FROM nft_settings WHERE id IN (
    '6e3f5c12-1638-42ce-a706-39f1f466d2c9',
    '0fc34a35-d703-4bf9-a075-847c6fa8dd5c',
    'ffde1699-3f89-4071-8c7c-9b41b19f00c6',
    '7b4a793a-1461-4863-8ec7-fa9a6bb570db'
);

-- 不足しているNFTデータを移行
INSERT INTO nft_settings (
    id,
    name,
    price,
    daily_rate,
    image_url,
    description,
    status,
    created_at,
    owner_id,
    last_transferred_at
)
SELECT 
    id,
    name,
    price,
    daily_rate,
    image_url,
    description,
    'active' as status,
    created_at,
    owner_id,
    last_transferred_at
FROM nfts
WHERE id IN (
    '6e3f5c12-1638-42ce-a706-39f1f466d2c9',
    '0fc34a35-d703-4bf9-a075-847c6fa8dd5c',
    'ffde1699-3f89-4071-8c7c-9b41b19f00c6',
    '7b4a793a-1461-4863-8ec7-fa9a6bb570db'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_rate = EXCLUDED.daily_rate,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    owner_id = EXCLUDED.owner_id,
    last_transferred_at = EXCLUDED.last_transferred_at;

-- データの整合性を確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    npr.id as request_id,
    npr.user_id,
    npr.status
FROM nft_settings ns
JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'; 