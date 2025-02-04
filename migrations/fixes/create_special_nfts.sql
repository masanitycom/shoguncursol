-- 1. 特例NFTを作成
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
    'SHOGUN NFT ' || price,
    price::numeric,
    CASE 
        WHEN price <= 500 THEN 0.005  -- 0.50%
        WHEN price <= 3000 THEN 0.01   -- 1.00%
        WHEN price <= 10000 THEN 0.0125 -- 1.25%
        ELSE 0.015                      -- 1.50%
    END,
    'SHOGUN NFT ' || price || ' - ' || 
    CASE 
        WHEN price <= 500 THEN price || ' USDT - 日利上限0.50% (特例NFT)'
        WHEN price <= 3000 THEN price || ' USDT - 日利上限1.00% (特例NFT)'
        WHEN price <= 10000 THEN price || ' USDT - 日利上限1.25% (特例NFT)'
        ELSE price || ' USDT - 日利上限1.50% (特例NFT)'
    END,
    '/images/nft' || price || '.png',
    'active'
FROM unnest(ARRAY[100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000]) as price;

-- 2. 特例NFTのnftsテーブルのレコードを作成
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
    'special'
FROM nft_settings
WHERE price::numeric IN (100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000)
AND id NOT IN (SELECT id FROM nfts);

-- 3. 確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    n.description
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric; 