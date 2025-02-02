-- 特定のユーザーの購入申請と所有NFTの関連を確認
SELECT 
    pr.id as request_id,
    pr.user_id,
    pr.nft_id,
    pr.status,
    pr.created_at,
    un.id as user_nft_id,
    un.nft_id as owned_nft_id
FROM 
    nft_purchase_requests pr
LEFT JOIN 
    user_nfts un 
    ON pr.user_id = un.user_id 
    AND pr.nft_id = un.nft_id
WHERE 
    pr.user_id = 'テストユーザーのID'
LIMIT 5; 