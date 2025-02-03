-- 承認済みリクエストの確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.status, npr.approved_at DESC;

-- get_user_nfts関数の結果を確認
SELECT * FROM get_user_nfts('fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33');

-- NFTごとのリクエスト数を確認
SELECT 
    ns.name,
    COUNT(*) as request_count,
    COUNT(*) FILTER (WHERE npr.status = 'approved') as approved_count
FROM nft_settings ns
JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
GROUP BY ns.id, ns.name
ORDER BY ns.name; 