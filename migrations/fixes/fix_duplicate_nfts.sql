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

-- 1. 重複しているNFTの詳細を確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    ns.created_at,
    n.description,
    COUNT(npr.id) as purchase_request_count,
    STRING_AGG(DISTINCT npr.status, ', ') as request_statuses
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE ns.name = 'SHOGUN NFT 3000'
GROUP BY ns.id, ns.name, ns.price, ns.daily_rate, ns.created_at, n.description
ORDER BY ns.created_at;

-- 2. 購入リクエストの移行（古い方から新しい方へ）
WITH target_nfts AS (
    SELECT 
        id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY name, price ORDER BY created_at) as rn
    FROM nft_settings
    WHERE name = 'SHOGUN NFT 3000'
)
UPDATE nft_purchase_requests
SET nft_id = (
    SELECT id FROM target_nfts WHERE rn = 1
)
WHERE nft_id IN (
    SELECT id FROM target_nfts WHERE rn = 2
);

-- 3. 重複データの削除（購入リクエストを移行した後）
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY name, price ORDER BY created_at) as rn
    FROM nft_settings
    WHERE name = 'SHOGUN NFT 3000'
)
DELETE FROM nft_settings
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 4. 確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    n.description,
    COUNT(npr.id) as purchase_request_count
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE ns.name = 'SHOGUN NFT 3000'
GROUP BY ns.id, ns.name, ns.price, ns.daily_rate, n.description; 