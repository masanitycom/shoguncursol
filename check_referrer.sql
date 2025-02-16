-- TEST001の存在確認
SELECT 
    id,
    user_id,
    display_id,
    email
FROM profiles
WHERE display_id = 'TEST001';

-- 大文字小文字を区別しない検索で確認
SELECT 
    id,
    user_id,
    display_id,
    email
FROM profiles
WHERE LOWER(display_id) = LOWER('TEST001'); 