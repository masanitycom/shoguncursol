-- testadminユーザー用のNFT購入データを追加
INSERT INTO nft_purchase_requests (
    id,
    user_id,
    nft_id,
    status,
    created_at,
    approved_at
) VALUES (
    gen_random_uuid(),
    '83f0dbdd-87fc-430b-8204-426fd85dfae2',  -- testadminのユーザーID
    '7b4a793a-1461-4863-8ec7-fa9a6bb570db',  -- SHOGUN NFT 1000のID
    'approved',
    NOW(),
    NOW()
);

-- 追加したデータを確認
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.daily_rate
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = '83f0dbdd-87fc-430b-8204-426fd85dfae2'; 