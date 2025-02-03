-- 外部キー制約を追加
ALTER TABLE nft_purchase_requests
    ADD CONSTRAINT fk_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id);

-- プロフィール情報を直接取得するようにクエリを修正
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
    p.display_name as user_display_name
FROM nft_purchase_requests npr
JOIN nfts n ON npr.nft_id = n.id
JOIN auth.users au ON npr.user_id = au.id
LEFT JOIN profiles p ON npr.user_id = p.id
ORDER BY 
    CASE 
        WHEN npr.status = 'pending' THEN 1
        WHEN npr.status = 'approved' THEN 2
        ELSE 3
    END,
    npr.created_at DESC; 