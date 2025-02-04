-- 現在の購入リクエストとプロファイル情報を確認
SELECT 
    npr.id,
    npr.user_id,
    npr.status,
    p.name as profile_name,
    p.email
FROM nft_purchase_requests npr
LEFT JOIN profiles p ON npr.user_id = p.id
ORDER BY npr.created_at DESC
LIMIT 10; 