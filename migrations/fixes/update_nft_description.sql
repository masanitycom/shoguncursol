-- 1. NFTの説明文と日利率を更新
UPDATE nfts
SET description = CASE 
    WHEN name = 'SHOGUN NFT 3000' THEN 'SHOGUN NFT 3000 - 3,000 USDT - 日利上限1.00%'
    ELSE description
END
WHERE name = 'SHOGUN NFT 3000';

-- 2. 更新後の確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.description,
    COUNT(npr.id) as request_count,
    STRING_AGG(DISTINCT npr.status, ', ') as request_statuses
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
LEFT JOIN nft_purchase_requests npr ON ns.id = npr.nft_id
WHERE ns.name = 'SHOGUN NFT 3000'
GROUP BY ns.name, ns.price, ns.daily_rate, n.description; 