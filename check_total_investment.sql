-- 承認済みNFTの合計額を確認
SELECT 
    SUM(ns.price) as total_investment,
    COUNT(*) as total_approved_nfts
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved';

-- 各NFTの詳細も確認
SELECT 
    npr.id,
    npr.status,
    ns.name as nft_name,
    ns.price,
    npr.created_at,
    npr.approved_at
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
ORDER BY npr.approved_at DESC; 