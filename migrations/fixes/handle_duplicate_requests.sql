-- 重複リクエストの状態を確認
SELECT 
    npr.id as request_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.nft_id = '7b4a793a-1461-4863-8ec7-fa9a6bb570db'
AND npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC;

-- 最新のリクエスト以外を拒否
WITH ranked_requests AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM nft_purchase_requests
    WHERE nft_id = '7b4a793a-1461-4863-8ec7-fa9a6bb570db'
    AND user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'pending'
)
UPDATE nft_purchase_requests
SET status = 'rejected'
WHERE id IN (
    SELECT id 
    FROM ranked_requests 
    WHERE rn > 1
);

-- 最新のリクエストを承認
SELECT approve_nft_request('8a118295-53ad-481e-9648-3fd6569589f8');

-- 最終的な状態を確認
SELECT 
    npr.id as request_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.nft_id = '7b4a793a-1461-4863-8ec7-fa9a6bb570db'
AND npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC; 