-- 関数の実行権限を再設定
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_nfts(UUID) TO authenticated;

-- 関数を修正してデバッグ情報を追加
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
    -- デバッグ情報を出力
    RAISE NOTICE 'Starting get_user_nfts for user_id: %', user_id_param;
    
    -- 購入リクエストの件数を確認
    SELECT COUNT(*) INTO v_count
    FROM nft_purchase_requests npr
    WHERE npr.user_id = user_id_param
    AND npr.status = 'approved';
    
    RAISE NOTICE 'Found % approved purchase requests', v_count;

    RETURN QUERY
    WITH latest_requests AS (
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
        lr.id as request_id,
        lr.user_id,
        lr.nft_id,
        lr.status::VARCHAR,
        lr.approved_at,
        ns.name::VARCHAR,
        ns.price::NUMERIC,
        ns.daily_rate::NUMERIC,
        COALESCE(ns.image_url, '/images/default-nft.png')::VARCHAR as image_url,
        ns.description::VARCHAR
    FROM latest_requests lr
    INNER JOIN nft_settings ns ON lr.nft_id = ns.id
    ORDER BY lr.approved_at DESC;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Returning % rows', v_count;
END;
$$ LANGUAGE plpgsql;

-- テスト実行
DO $$
BEGIN
    RAISE NOTICE 'Testing get_user_nfts function...';
    PERFORM * FROM get_user_nfts('fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33');
    RAISE NOTICE 'Test completed';
END $$;

-- 実際のデータを確認
SELECT * FROM get_user_nfts('fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33');

-- 権限の確認
SELECT 
    grantee, privilege_type, is_grantable
FROM 
    information_schema.routine_privileges
WHERE 
    routine_name = 'get_user_nfts'; 