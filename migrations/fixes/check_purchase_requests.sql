-- NFT購入リクエストの状態を確認
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name as nft_name,
    ns.price
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
ORDER BY npr.created_at DESC;

-- ステータスごとの集計
SELECT 
    status,
    COUNT(*) as count
FROM nft_purchase_requests
GROUP BY status;

-- 特定のユーザーの購入リクエスト状態
SELECT 
    npr.status,
    COUNT(*) as count,
    string_agg(ns.name, ', ') as nft_names
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
GROUP BY npr.status;

-- 必要に応じて、テストデータを追加
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
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33', -- testuser
    '7b4a793a-1461-4863-8ec7-fa9a6bb570db', -- NFT ID
    'pending',
    NOW(),
    'bank_transfer'
),
(
    gen_random_uuid(),
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33', -- testuser
    '0fc34a35-d703-4bf9-a075-847c6fa8dd5c', -- NFT ID
    'pending',
    NOW(),
    'bank_transfer'
);

-- 既存のリクエストのステータスを更新（テスト用）
UPDATE nft_purchase_requests
SET status = 'pending',
    approved_at = NULL
WHERE id IN (
    SELECT id FROM nft_purchase_requests
    ORDER BY created_at DESC
    LIMIT 2
); 