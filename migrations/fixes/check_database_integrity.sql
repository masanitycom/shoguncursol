-- ユーザーとNFTの関連を確認
SELECT 
    au.email,
    COUNT(npr.id) as nft_count,
    SUM(CAST(ns.price AS numeric)) as total_investment
FROM auth.users au
LEFT JOIN nft_purchase_requests npr ON au.id = npr.user_id
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
GROUP BY au.email; 