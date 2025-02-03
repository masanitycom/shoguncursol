-- NFT購入リクエストとNFT設定のリレーションを確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    ns.name as nft_name,
    ns.price as nft_price
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
ORDER BY npr.created_at DESC; 