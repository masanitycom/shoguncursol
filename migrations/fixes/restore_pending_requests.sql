-- 新しい購入リクエストを追加
INSERT INTO nft_purchase_requests (
    id,
    user_id,
    nft_id,
    status,
    created_at,
    payment_method
) VALUES 
(
    gen_random_uuid(),
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33',  -- testuser
    '7b128ecd-0b15-4b50-8314-770c71dd91d8',  -- SHOGUN NFT 500
    'pending',
    NOW(),
    'bank_transfer'
),
(
    gen_random_uuid(),
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33',  -- testuser
    'cbe68883-1d11-41e1-aa8b-458c37cc8a4f',  -- SHOGUN NFT 3000
    'pending',
    NOW(),
    'bank_transfer'
);

-- 状態を確認
SELECT 
    npr.id,
    npr.status,
    ns.name as nft_name,
    npr.created_at
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'pending'
ORDER BY npr.created_at DESC;

-- ステータス別の集計を再確認
SELECT 
    status,
    COUNT(*) as count
FROM nft_purchase_requests
GROUP BY status; 