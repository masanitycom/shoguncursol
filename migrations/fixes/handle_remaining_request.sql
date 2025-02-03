-- SHOGUN NFT 3000のリクエストを確認
SELECT 
    npr.id as request_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.owner_id,
    CASE 
        WHEN ns.owner_id IS NULL THEN 'Available'
        WHEN ns.owner_id = npr.user_id THEN 'Owned by requester'
        ELSE 'Owned by other'
    END as availability_status
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.id = '2328ae39-9c16-4457-8381-e01941827ca4';

-- このリクエストは他のユーザーが所有しているNFTに対するものなので拒否
UPDATE nft_purchase_requests
SET status = 'rejected'
WHERE id = '2328ae39-9c16-4457-8381-e01941827ca4';

-- 最終的な状態を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status IN ('approved', 'pending')
AND npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.status, npr.approved_at DESC; 