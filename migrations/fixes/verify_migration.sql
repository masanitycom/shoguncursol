-- 移行後のデータ確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.status,
    ns.owner_id,
    npr.id as request_id,
    npr.status as request_status
FROM nft_settings ns
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE npr.status = 'approved'
ORDER BY npr.created_at DESC; 