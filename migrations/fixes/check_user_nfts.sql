-- ユーザーのNFT購入リクエストを確認
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.image_url
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved';

-- ユーザー情報を確認
SELECT id, email 
FROM auth.users 
WHERE email = 'testuser@gmail.com'; 