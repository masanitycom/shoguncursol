-- 1. 現在のNFTの状態を確認
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    n.description,
    CASE 
        WHEN ns.price IN (100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000) THEN 'special'
        ELSE 'normal'
    END as correct_type,
    CASE 
        WHEN ns.price <= 500 THEN 0.005
        WHEN ns.price <= 3000 THEN 0.01
        WHEN ns.price <= 5000 THEN 0.01
        WHEN ns.price <= 10000 THEN 0.0125
        WHEN ns.price <= 30000 THEN 0.015
        ELSE 0.02
    END as correct_daily_rate
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric;

-- 2. 重複データの確認
SELECT name, price, COUNT(*)
FROM nft_settings
GROUP BY name, price
HAVING COUNT(*) > 1;

-- 3. NFTの種類の定義を更新
ALTER TABLE nfts
DROP CONSTRAINT IF EXISTS nfts_nft_type_check;

ALTER TABLE nfts
ADD CONSTRAINT nfts_nft_type_check 
CHECK (nft_type = ANY (ARRAY[
    'normal'::text,   -- 通常NFT
    'special'::text   -- 特例NFT
]));

-- 4. daily_rateとNFTタイプを修正
UPDATE nft_settings
SET daily_rate = 
    CASE 
        WHEN price::numeric <= 500 THEN 0.005
        WHEN price::numeric <= 3000 THEN 0.01
        WHEN price::numeric <= 5000 THEN 0.01
        WHEN price::numeric <= 10000 THEN 0.0125
        WHEN price::numeric <= 30000 THEN 0.015
        ELSE 0.02
    END;

UPDATE nfts
SET nft_type = 
    CASE 
        WHEN price::numeric IN (100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000) THEN 'special'
        ELSE 'normal'
    END;

-- 5. 重複データの処理（必要に応じて）
WITH duplicates AS (
    SELECT id, name, price,
    ROW_NUMBER() OVER (PARTITION BY name, price ORDER BY id) as rn
    FROM nft_settings
)
DELETE FROM nft_settings
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 6. 更新後の確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    CASE 
        WHEN n.nft_type = 'special' THEN '特例NFT'
        ELSE '通常NFT'
    END as type_description
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric; 