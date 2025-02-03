-- 承認処理用の関数を作成
CREATE OR REPLACE FUNCTION approve_nft_request(request_id_param UUID)
RETURNS VOID AS $$
DECLARE
    v_nft_id UUID;
    v_user_id UUID;
BEGIN
    -- リクエストの情報を取得
    SELECT nft_id, user_id 
    INTO v_nft_id, v_user_id
    FROM nft_purchase_requests
    WHERE id = request_id_param;

    -- リクエストを承認
    UPDATE nft_purchase_requests
    SET 
        status = 'approved',
        approved_at = CURRENT_TIMESTAMP
    WHERE id = request_id_param;

    -- NFTの所有者を更新
    UPDATE nft_settings
    SET owner_id = v_user_id
    WHERE id = v_nft_id;

    RAISE NOTICE 'Request % approved for NFT % and user %', request_id_param, v_nft_id, v_user_id;
END;
$$ LANGUAGE plpgsql;

-- SHOGUN NFT 500のリクエストを承認
SELECT approve_nft_request('624b94cf-44c9-4ce9-98d3-cbe7c0fd347f');

-- 承認後の状態を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.approved_at,
    ns.name,
    ns.price,
    ns.owner_id
FROM nft_purchase_requests npr
JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.id = '624b94cf-44c9-4ce9-98d3-cbe7c0fd347f'; 