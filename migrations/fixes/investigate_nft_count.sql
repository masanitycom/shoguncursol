-- 承認済みリクエストの詳細確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name as nft_name,
    ns.price,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- NFTごとの承認済みリクエスト数を確認（重複チェック）
SELECT 
    ns.name as nft_name,
    COUNT(*) as approved_count,
    string_agg(npr.id::text, ', ') as request_ids,
    string_agg(npr.approved_at::text, ', ') as approval_dates
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved'
GROUP BY ns.name
HAVING COUNT(*) > 1;

-- owner_idの確認
SELECT 
    id,
    name,
    price,
    owner_id
FROM nft_settings
WHERE owner_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'; 