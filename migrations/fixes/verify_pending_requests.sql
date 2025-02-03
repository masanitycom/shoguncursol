-- 保留中のリクエストを確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'pending'
ORDER BY npr.created_at DESC;

-- 承認可能なリクエストを確認（owner_idがnullまたは申請者と一致するもの）
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.owner_id,
    CASE 
        WHEN ns.owner_id IS NULL THEN 'Available'
        WHEN ns.owner_id = npr.user_id THEN 'Owned by requester'
        ELSE 'Owned by other'
    END as availability_status
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'pending'
AND (ns.owner_id IS NULL OR ns.owner_id = npr.user_id)
ORDER BY npr.created_at DESC; 