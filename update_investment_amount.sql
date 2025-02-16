-- 現在の投資額を確認
SELECT 
    npr.id as request_id,
    ns.name as nft_name,
    ns.price as nft_price,
    npr.status,
    npr.created_at,
    npr.approved_at
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'
AND npr.status = 'approved';

-- 承認済みNFTの合計投資額を計算
WITH approved_investments AS (
    SELECT 
        SUM(ns.price) as total_investment
    FROM nft_purchase_requests npr
    JOIN nft_settings ns ON npr.nft_id = ns.id
    WHERE npr.user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'
    AND npr.status = 'approved'
)
UPDATE profiles
SET 
    investment_amount = COALESCE((SELECT total_investment FROM approved_investments), 0),
    updated_at = NOW()
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'
RETURNING user_id, display_id, investment_amount, updated_at; 