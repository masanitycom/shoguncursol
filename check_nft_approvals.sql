-- 承認済みNFTの購入リクエストを確認
SELECT 
    npr.id,
    p.display_id,
    p.email,
    ns.name as nft_name,
    ns.price,
    npr.status,
    npr.created_at,
    npr.approved_at
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.user_id
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
ORDER BY npr.approved_at DESC;

-- 承認済みNFTの合計金額を確認
SELECT 
    p.display_id,
    p.email,
    COUNT(*) as approved_nfts,
    SUM(ns.price) as total_investment
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.user_id
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
GROUP BY p.display_id, p.email
ORDER BY total_investment DESC; 