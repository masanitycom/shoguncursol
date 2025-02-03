-- まず利用可能なステータスを確認
SELECT DISTINCT status FROM nft_purchase_requests;

-- 重複したリクエストの最新のもの以外を拒否状態に更新
WITH ranked_requests AS (
    SELECT 
        id,
        nft_id,
        approved_at,
        ROW_NUMBER() OVER (PARTITION BY nft_id ORDER BY approved_at DESC) as rn
    FROM nft_purchase_requests
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
)
UPDATE nft_purchase_requests
SET status = 'rejected'  -- 'cancelled' から 'rejected' に変更
WHERE id IN (
    SELECT id 
    FROM ranked_requests 
    WHERE rn > 1
);

-- owner_idを更新
UPDATE nft_settings
SET owner_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
WHERE id IN (
    SELECT nft_id
    FROM nft_purchase_requests
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
    AND status = 'approved'
);

-- get_user_nfts関数を修正
CREATE OR REPLACE FUNCTION get_user_nfts(user_id_param UUID)
RETURNS TABLE (
    request_id UUID,
    user_id UUID,
    nft_id UUID,
    status VARCHAR,
    approved_at TIMESTAMPTZ,
    name VARCHAR,
    price NUMERIC,
    daily_rate NUMERIC,
    image_url VARCHAR,
    description VARCHAR
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    RETURN QUERY
    WITH latest_approved_requests AS (
        SELECT DISTINCT ON (npr.nft_id)
            npr.id,
            npr.user_id,
            npr.nft_id,
            npr.status,
            npr.approved_at
        FROM nft_purchase_requests npr
        WHERE npr.user_id = user_id_param
        AND npr.status = 'approved'
        ORDER BY npr.nft_id, npr.approved_at DESC
    )
    SELECT 
        lar.id as request_id,
        lar.user_id,
        lar.nft_id,
        lar.status::VARCHAR,
        lar.approved_at,
        ns.name::VARCHAR,
        ns.price::NUMERIC,
        ns.daily_rate::NUMERIC,
        COALESCE(ns.image_url, '/images/default-nft.png')::VARCHAR as image_url,
        ns.description::VARCHAR
    FROM latest_approved_requests lar
    INNER JOIN nft_settings ns ON lar.nft_id = ns.id
    ORDER BY lar.approved_at DESC;
END;
$$ LANGUAGE plpgsql; 