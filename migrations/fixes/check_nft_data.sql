-- 特定のユーザーのNFT購入リクエストを確認
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
ORDER BY npr.created_at DESC;

-- ユーザー情報を確認
SELECT id, email 
FROM auth.users 
WHERE id = '83f0dbdd-87fc-430b-8204-426fd85dfae2';

-- purchase_requests_viewのデータを確認
SELECT * FROM purchase_requests_view
WHERE user_id = '83f0dbdd-87fc-430b-8204-426fd85dfae2';

-- 既存のデータを確認
SELECT * FROM nft_purchase_requests 
WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND status = 'approved';

-- 結合クエリを確認
SELECT 
    npr.*,
    ns.*
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved';

-- nft_settingsテーブルの構造を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'nft_settings';

-- nft_settingsテーブルのデータを確認
SELECT * FROM nft_settings;

-- nftsテーブルのデータを確認
SELECT * FROM nfts;

-- データの移行が必要な場合
INSERT INTO nft_settings (
    id,
    name,
    price,
    daily_rate,
    image_url,
    created_at,
    updated_at
)
SELECT 
    id,
    name,
    price,
    COALESCE(daily_rate, 1.0),
    image_url,
    created_at,
    updated_at
FROM nfts
WHERE id IN (
    '7b4a793a-1461-4863-8ec7-fa9a6bb570db',
    '0fc34a35-d703-4bf9-a075-847c6fa8dd5c',
    '6e3f5c12-1638-42ce-a706-39f1f466d2c9',
    'ffde1699-3f89-4071-8c7c-9b41b19f00c6'
)
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_rate = EXCLUDED.daily_rate,
    image_url = EXCLUDED.image_url;

-- データが正しく移行されたか確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    npr.user_id,
    npr.status
FROM nft_settings ns
JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved';

-- NFTデータの整合性を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    ns.id as settings_id,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.image_url
FROM nft_purchase_requests npr
INNER JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
AND npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC;

-- 購入リクエストの状態を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name as nft_name,
    ns.price as nft_price,
    ns.daily_rate,
    ns.status as nft_status
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- NFTの所有状態を確認
SELECT 
    ns.*,
    npr.approved_at,
    npr.status as request_status
FROM nft_settings ns
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE ns.owner_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
OR npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'; 