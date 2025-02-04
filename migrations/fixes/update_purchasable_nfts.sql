-- 1. 既存の関数を削除
DROP FUNCTION IF EXISTS get_purchasable_nfts();
DROP FUNCTION IF EXISTS get_all_nfts_for_admin();
DROP FUNCTION IF EXISTS admin_assign_nft(UUID, UUID, UUID);

-- 2. 購入可能なNFT（通常NFTのみ）を取得する関数
CREATE OR REPLACE FUNCTION get_purchasable_nfts()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    price NUMERIC,
    daily_rate NUMERIC,
    description VARCHAR,
    image_url VARCHAR,
    nft_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.name,
        ns.price::numeric,
        ns.daily_rate,
        n.description::VARCHAR,
        COALESCE(ns.image_url, '/images/default-nft.png')::VARCHAR,
        n.nft_type::VARCHAR
    FROM nft_settings ns
    LEFT JOIN nfts n ON ns.id = n.id
    WHERE n.nft_type = 'normal'  -- 通常NFTのみを取得
    AND ns.status = 'active'     -- アクティブなNFTのみ
    ORDER BY ns.price::numeric;
END;
$$ LANGUAGE plpgsql;

-- 3. 管理者用の全NFT取得関数
CREATE OR REPLACE FUNCTION get_all_nfts_for_admin()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    price NUMERIC,
    daily_rate NUMERIC,
    description VARCHAR,
    image_url VARCHAR,
    nft_type VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ns.id,
        ns.name,
        ns.price::numeric,
        ns.daily_rate,
        n.description::VARCHAR,
        COALESCE(ns.image_url, '/images/default-nft.png')::VARCHAR,
        n.nft_type::VARCHAR,
        ns.status::VARCHAR
    FROM nft_settings ns
    LEFT JOIN nfts n ON ns.id = n.id
    ORDER BY n.nft_type, ns.price::numeric;
END;
$$ LANGUAGE plpgsql;

-- 4. 管理者用のNFT付与関数
CREATE OR REPLACE FUNCTION admin_assign_nft(
    p_user_id UUID,
    p_nft_id UUID,
    p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- NFT購入リクエストを作成（管理者による付与）
    INSERT INTO nft_purchase_requests (
        user_id,
        nft_id,
        status,
        approved_at,
        approved_by
    ) VALUES (
        p_user_id,
        p_nft_id,
        'approved',
        NOW(),
        p_admin_id
    ) RETURNING id INTO v_request_id;

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- 5. 確認
SELECT * FROM get_purchasable_nfts();
SELECT * FROM get_all_nfts_for_admin(); 