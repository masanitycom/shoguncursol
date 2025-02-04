-- 1. まず現在のデータ状態を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    ns.id as settings_id,
    ns.name as nft_name,
    p.name as user_name
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
LEFT JOIN profiles p ON npr.user_id = p.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33';

-- 2. nft_settingsテーブルとnftsテーブルの関係を確認
SELECT 
    ns.id,
    ns.name,
    n.id as nft_id
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id;

-- 3. nftsテーブルの制約を確認
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'nfts';

-- 4. NOT NULL制約を削除
ALTER TABLE nfts 
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN nft_type DROP NOT NULL;

-- 5. nft_typeのチェック制約を一時的に削除
ALTER TABLE nfts
DROP CONSTRAINT IF EXISTS nfts_nft_type_check;

-- 6. 新しいチェック制約を追加
ALTER TABLE nfts
ADD CONSTRAINT nfts_nft_type_check 
CHECK (nft_type = ANY (ARRAY['normal'::text, 'special'::text]));

-- 7. 既存のnft_typeの値を確認
SELECT DISTINCT nft_type
FROM nfts
ORDER BY nft_type;

-- 8. 不整合データの修正（修正版）
WITH nft_data AS (
    SELECT 
        ns.id,
        ns.name,
        ns.price,
        ns.daily_rate,
        ns.image_url,
        'active' as status,
        CASE 
            WHEN ns.name LIKE '%300%' THEN 'SHOGUN NFT 300 - Entry Level NFT'
            WHEN ns.name LIKE '%500%' THEN 'SHOGUN NFT 500 - Basic NFT'
            WHEN ns.name LIKE '%1000%' THEN 'SHOGUN NFT 1000 - Standard NFT'
            WHEN ns.name LIKE '%3000%' THEN 'SHOGUN NFT 3000 - Premium NFT'
            WHEN ns.name LIKE '%5000%' THEN 'SHOGUN NFT 5000 - Elite NFT'
            ELSE ns.name || ' - Investment NFT'
        END as description,
        CASE 
            WHEN ns.price >= 5000 THEN 'special'
            ELSE 'normal'
        END as nft_type
    FROM nft_settings ns
    WHERE ns.id IN (
        SELECT DISTINCT nft_id 
        FROM nft_purchase_requests 
        WHERE nft_id NOT IN (SELECT id FROM nfts)
    )
)
INSERT INTO nfts (
    id, name, price, daily_rate, image_url, 
    status, description, nft_type
)
SELECT 
    id, name, price, daily_rate, image_url,
    status, description, nft_type
FROM nft_data
ON CONFLICT (id) DO UPDATE
SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_rate = EXCLUDED.daily_rate,
    image_url = EXCLUDED.image_url,
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    nft_type = EXCLUDED.nft_type;

-- 9. 外部キー制約を修正
ALTER TABLE nft_purchase_requests
    DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey;

ALTER TABLE nft_purchase_requests
    ADD CONSTRAINT nft_purchase_requests_nft_id_fkey 
    FOREIGN KEY (nft_id) 
    REFERENCES nft_settings(id);

-- 10. データ確認クエリ
SELECT 
    npr.id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    p.name as user_name,
    p.email,
    ns.name as nft_name,
    n.description as nft_description,
    n.nft_type
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.id
JOIN nft_settings ns ON npr.nft_id = ns.id
LEFT JOIN nfts n ON npr.nft_id = n.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC;

-- 11. データ確認
SELECT 
    n.id,
    n.name,
    n.price,
    n.nft_type,
    n.description,
    n.status
FROM nfts n
WHERE n.id IN (
    SELECT DISTINCT nft_id
    FROM nft_purchase_requests
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
)
ORDER BY n.price; 