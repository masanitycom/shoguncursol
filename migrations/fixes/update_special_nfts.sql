-- 1. 特例NFTの価格リストを確認
WITH special_prices AS (
    SELECT unnest(ARRAY[100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000]) as price
)
SELECT 
    ns.id,
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    CASE WHEN sp.price IS NOT NULL THEN true ELSE false END as should_be_special
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
LEFT JOIN special_prices sp ON ns.price::numeric = sp.price
ORDER BY ns.price::numeric;

-- 2. NFTタイプを更新
UPDATE nfts
SET nft_type = 'special'
WHERE id IN (
    SELECT ns.id
    FROM nft_settings ns
    WHERE ns.price::numeric IN (100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000)
);

UPDATE nfts
SET nft_type = 'normal'
WHERE id IN (
    SELECT ns.id
    FROM nft_settings ns
    WHERE ns.price::numeric IN (300, 500, 1000, 3000, 5000, 10000, 30000, 100000)
);

-- 3. 更新後の確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    n.description,
    CASE 
        WHEN ns.price::numeric IN (100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000) THEN '特例NFT'
        ELSE '通常NFT'
    END as expected_type
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric; 