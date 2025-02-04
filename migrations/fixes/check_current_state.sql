-- 外部キー関係を修正
ALTER TABLE nft_purchase_requests
    DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey,
    ADD CONSTRAINT nft_purchase_requests_nft_id_fkey 
    FOREIGN KEY (nft_id) 
    REFERENCES nfts(id);

-- 結合クエリを確認（修正後）
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    n.name,
    n.price,
    n.daily_rate,
    n.image_url
FROM nft_purchase_requests npr
JOIN nfts n ON npr.nft_id = n.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
AND npr.status = 'approved';

-- 現在のプロファイル情報を確認
SELECT id, name, email, updated_at 
FROM profiles 
WHERE id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33';

-- 購入リクエストの情報を確認
SELECT npr.id, npr.user_id, npr.status, p.name as current_name
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'; 