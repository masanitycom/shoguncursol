-- まず既存の関数を削除
DROP FUNCTION IF EXISTS get_user_nfts(UUID);

-- 関数を再作成
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

    RETURN QUERY
    WITH latest_approved_requests AS (
        -- 各NFTの最新の承認済みリクエストのみを取得
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
    -- 現在のオーナーが一致するもののみを取得
    WHERE (ns.owner_id IS NULL OR ns.owner_id = user_id_param)
    ORDER BY lar.approved_at DESC;

    -- 結果の件数をログ
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