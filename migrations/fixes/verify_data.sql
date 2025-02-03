-- データの整合性を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.image_url,
    ns.description
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- NFTの購入リクエストとNFT設定の関連を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.image_url,
    ns.description
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- NFT設定テーブルの状態確認
SELECT * FROM nft_settings WHERE id IN (
    SELECT nft_id 
    FROM nft_purchase_requests 
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
); 