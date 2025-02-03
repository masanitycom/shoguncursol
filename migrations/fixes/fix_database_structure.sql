-- ユーザープロファイルテーブルの修正
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- NFT購入リクエストのビューを修正
DROP VIEW IF EXISTS purchase_requests_view;
CREATE OR REPLACE VIEW purchase_requests_view AS
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.name as nft_name,
    CAST(ns.price AS numeric) as nft_price,
    CAST(ns.daily_rate AS numeric) as nft_daily_rate,
    ns.image_url as nft_image_url,
    au.email as user_email,
    au.display_name as user_display_name
FROM nft_purchase_requests npr
INNER JOIN nft_settings ns ON npr.nft_id = ns.id
INNER JOIN auth.users au ON npr.user_id = au.id
WHERE npr.status = 'approved';

-- ビューのデータを確認
SELECT * FROM purchase_requests_view
WHERE user_id = '83f0dbdd-87fc-430b-8204-426fd85dfae2'; 