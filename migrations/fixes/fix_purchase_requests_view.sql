-- ビューを修正して、すべてのステータスを表示
DROP VIEW IF EXISTS purchase_requests_view;

CREATE OR REPLACE VIEW purchase_requests_view AS
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    n.name as nft_name,
    n.price as nft_price,
    n.daily_rate as nft_daily_rate,
    n.image_url as nft_image_url,
    au.email as user_email,
    au.display_name as user_display_name
FROM nft_purchase_requests npr
JOIN nfts n ON npr.nft_id = n.id
JOIN auth.users au ON npr.user_id = au.id
ORDER BY 
    CASE 
        WHEN npr.status = 'pending' THEN 1
        WHEN npr.status = 'approved' THEN 2
        WHEN npr.status = 'rejected' THEN 3
        ELSE 4
    END,
    npr.created_at DESC;

-- ビューが正しく動作しているか確認
SELECT * FROM purchase_requests_view; 