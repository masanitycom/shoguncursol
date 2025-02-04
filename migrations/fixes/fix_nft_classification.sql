-- 1. 現在の分類を確認
WITH normal_nft_prices AS (
    SELECT unnest(ARRAY[300, 500, 1000, 3000, 5000, 10000, 30000, 100000]) as price
),
special_nft_prices AS (
    SELECT unnest(ARRAY[100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000]) as price
)
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type as current_type,
    CASE 
        WHEN sp.price IS NOT NULL THEN 'special'
        WHEN np.price IS NOT NULL THEN 'normal'
        ELSE 'unknown'
    END as correct_type
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
LEFT JOIN special_nft_prices sp ON ns.price::numeric = sp.price
LEFT JOIN normal_nft_prices np ON ns.price::numeric = np.price
ORDER BY ns.price::numeric;

-- 2. SHOGUN NFT 100000を作成
INSERT INTO nft_settings (
    id,
    name,
    price,
    daily_rate,
    description,
    image_url,
    status
)
SELECT 
    gen_random_uuid(),
    'SHOGUN NFT 100000',
    100000,
    0.02,  -- 2.00%
    'SHOGUN NFT 100000 - 100,000 USDT - 日利上限2.00%',
    '/images/nft100000.png',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM nft_settings WHERE price = 100000
);

-- 3. nftsテーブルにも追加
INSERT INTO nfts (
    id,
    name,
    price,
    daily_rate,
    description,
    image_url,
    status,
    nft_type
)
SELECT 
    id,
    name,
    price::numeric,
    daily_rate,
    description,
    image_url,
    status,
    'normal'
FROM nft_settings
WHERE price::numeric = 100000
AND id NOT IN (SELECT id FROM nfts);

-- 4. 確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    CASE 
        WHEN n.nft_type = 'special' THEN '特例NFT'
        ELSE '通常NFT'
    END as type_description,
    n.description
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric; 