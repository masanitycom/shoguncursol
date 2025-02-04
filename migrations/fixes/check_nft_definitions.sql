-- 1. NFTの定義を確認
SELECT 
    ns.name,
    ns.price,
    ns.daily_rate,
    n.nft_type,
    n.description
FROM nft_settings ns
LEFT JOIN nfts n ON ns.id = n.id
ORDER BY ns.price::numeric;

-- 2. NFTの種類の定義を更新
ALTER TABLE nfts
DROP CONSTRAINT IF EXISTS nfts_nft_type_check;

ALTER TABLE nfts
ADD CONSTRAINT nfts_nft_type_check 
CHECK (nft_type = ANY (ARRAY[
    'bronze'::text,   -- 300-500 USDT: エントリーレベル
    'silver'::text,   -- 1000 USDT: スタンダード
    'gold'::text,     -- 3000 USDT: プレミアム
    'platinum'::text, -- 5000 USDT: エリート
    'diamond'::text   -- 10000 USDT以上: VIP
]));

-- 3. NFTタイプを更新
UPDATE nfts
SET nft_type = CASE 
    WHEN price::numeric <= 500 THEN 'bronze'
    WHEN price::numeric <= 1000 THEN 'silver'
    WHEN price::numeric <= 3000 THEN 'gold'
    WHEN price::numeric <= 5000 THEN 'platinum'
    ELSE 'diamond'
END;

-- 4. 更新後の分類を確認
SELECT 
    nft_type,
    COUNT(*) as count,
    MIN(price::numeric) as min_price,
    MAX(price::numeric) as max_price,
    AVG(daily_rate::numeric) as avg_daily_rate
FROM nfts
GROUP BY nft_type
ORDER BY MIN(price::numeric); 