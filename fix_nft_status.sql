-- NFTステータスの更新
UPDATE user_nfts
SET status = 'active'
WHERE user_id = (
    SELECT id 
    FROM users 
    WHERE email = 'testTEST17390377527490006428744db@example.com'
)
AND status IS NULL;

-- ビューの作成
CREATE OR REPLACE VIEW v_user_nft_status AS
SELECT 
    u.email,
    u.level,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_nfts un 
            JOIN nfts n ON un.nft_id = n.id 
            WHERE un.user_id = u.id 
            AND un.status = 'active'
        ) THEN u.level
        ELSE 'none'
    END as effective_level,
    COUNT(DISTINCT un.id) as active_nft_count
FROM users u
LEFT JOIN user_nfts un ON u.id = un.user_id AND un.status = 'active'
GROUP BY u.email, u.level, u.id;

-- 確認クエリ
SELECT 
    email,
    level,
    effective_level,
    active_nft_count
FROM v_user_nft_status
WHERE email = 'testTEST17390377527490006428744db@example.com'; 