-- NFTデータの整合性を検証
WITH approved_requests AS (
    SELECT 
        npr.id as request_id,
        npr.user_id,
        npr.nft_id,
        npr.status,
        npr.approved_at,
        ns.name,
        ns.price,
        ns.daily_rate,
        ROW_NUMBER() OVER (
            PARTITION BY npr.nft_id, npr.user_id 
            ORDER BY npr.approved_at DESC
        ) as rn
    FROM nft_purchase_requests npr
    INNER JOIN nft_settings ns ON npr.nft_id = ns.id
    WHERE npr.status = 'approved'
)
SELECT *
FROM approved_requests
WHERE rn = 1
ORDER BY approved_at DESC;

-- NFTデータの整合性を確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    npr.id as request_id,
    npr.user_id,
    npr.status
FROM nft_settings ns
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE npr.status = 'approved'
AND npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33';

-- 外部キー制約を確認
SELECT conname, conrelid::regclass, confrelid::regclass, contype
FROM pg_constraint
WHERE conrelid = 'nft_purchase_requests'::regclass;

-- 承認済みの購入リクエストを確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- get_user_nfts関数の結果と比較
SELECT * FROM get_user_nfts('fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33');

-- 重複を確認
SELECT 
    nft_id,
    COUNT(*) as request_count,
    array_agg(approved_at ORDER BY approved_at DESC) as approved_dates
FROM nft_purchase_requests
WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND status = 'approved'
GROUP BY nft_id
HAVING COUNT(*) > 1;

-- owner_idの確認
SELECT 
    id,
    name,
    owner_id
FROM nft_settings
WHERE id IN (
    SELECT nft_id 
    FROM nft_purchase_requests 
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
); 