-- 1. 既存のnft_typeを更新
UPDATE nfts
SET nft_type = CASE 
    WHEN price::numeric >= 5000 THEN 'special'
    ELSE 'normal'
END;

-- 2. 更新を確認
SELECT 
    name,
    price,
    nft_type,
    description
FROM nfts
WHERE id IN (
    SELECT DISTINCT nft_id
    FROM nft_purchase_requests
    WHERE user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
)
ORDER BY price::numeric;

-- 3. 全てのNFTの型を確認
SELECT 
    nft_type,
    COUNT(*) as count,
    MIN(price::numeric) as min_price,
    MAX(price::numeric) as max_price
FROM nfts
GROUP BY nft_type
ORDER BY MIN(price::numeric); 