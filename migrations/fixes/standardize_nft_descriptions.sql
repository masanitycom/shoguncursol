-- 1. 全NFTの説明文と日利率を標準化
UPDATE nfts
SET description = CASE 
    WHEN name = 'SHOGUN NFT 300' THEN 'SHOGUN NFT 300 - 300 USDT - 日利上限0.50%'
    WHEN name = 'SHOGUN NFT 500' THEN 'SHOGUN NFT 500 - 500 USDT - 日利上限0.50%'
    WHEN name = 'SHOGUN NFT 1000' THEN 'SHOGUN NFT 1000 - 1,000 USDT - 日利上限1.00%'
    WHEN name = 'SHOGUN NFT 3000' THEN 'SHOGUN NFT 3000 - 3,000 USDT - 日利上限1.00%'
    WHEN name = 'SHOGUN NFT 5000' THEN 'SHOGUN NFT 5000 - 5,000 USDT - 日利上限1.00%'
    WHEN name = 'SHOGUN NFT 10000' THEN 'SHOGUN NFT 10000 - 10,000 USDT - 日利上限1.25%'
    WHEN name = 'SHOGUN NFT 30000' THEN 'SHOGUN NFT 30000 - 30,000 USDT - 日利上限1.50%'
    WHEN name = 'SHOGUN NFT 100000' THEN 'SHOGUN NFT 100000 - 100,000 USDT - 日利上限2.00%'
    ELSE description
END;

-- 2. 特例NFTの説明文を更新
UPDATE nfts
SET description = CASE 
    WHEN name = 'SHOGUN NFT 100' THEN 'SHOGUN NFT 100 - 100 USDT - 日利上限0.50% (特例NFT)'
    WHEN name = 'SHOGUN NFT 200' THEN 'SHOGUN NFT 200 - 200 USDT - 日利上限0.50% (特例NFT)'
    WHEN name = 'SHOGUN NFT 600' THEN 'SHOGUN NFT 600 - 600 USDT - 日利上限0.50% (特例NFT)'
    WHEN name = 'SHOGUN NFT 1177' THEN 'SHOGUN NFT 1177 - 1,177 USDT - 日利上限1.00% (特例NFT)'
    WHEN name = 'SHOGUN NFT 1300' THEN 'SHOGUN NFT 1300 - 1,300 USDT - 日利上限1.00% (特例NFT)'
    WHEN name = 'SHOGUN NFT 1500' THEN 'SHOGUN NFT 1500 - 1,500 USDT - 日利上限1.00% (特例NFT)'
    WHEN name = 'SHOGUN NFT 2000' THEN 'SHOGUN NFT 2000 - 2,000 USDT - 日利上限1.00% (特例NFT)'
    WHEN name = 'SHOGUN NFT 6600' THEN 'SHOGUN NFT 6600 - 6,600 USDT - 日利上限1.25% (特例NFT)'
    WHEN name = 'SHOGUN NFT 8000' THEN 'SHOGUN NFT 8000 - 8,000 USDT - 日利上限1.25% (特例NFT)'
    ELSE description
END
WHERE nft_type = 'special';

-- 3. daily_rateの更新
UPDATE nft_settings
SET daily_rate = CASE 
    WHEN price::numeric <= 500 THEN 0.005  -- 0.50%
    WHEN price::numeric <= 3000 THEN 0.01   -- 1.00%
    WHEN price::numeric <= 5000 THEN 0.01   -- 1.00%
    WHEN price::numeric <= 10000 THEN 0.0125 -- 1.25%
    WHEN price::numeric <= 30000 THEN 0.015  -- 1.50%
    ELSE 0.02                               -- 2.00%
END;

-- 4. 更新後の確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    n.description
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric; 