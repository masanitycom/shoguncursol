-- 最新の購入リクエストの詳細確認
SELECT 
    npr.id,
    npr.status,
    npr.created_at,
    ns.name,
    ns.price,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'pending'
ORDER BY npr.created_at DESC; 