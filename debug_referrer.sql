-- 紹介者IDの検索テスト
SELECT 
    id,
    user_id,
    display_id,
    email,
    LENGTH(display_id) as id_length,
    POSITION(' ' in display_id) as has_space
FROM profiles
WHERE 
    display_id = 'TEST001'
    OR display_id ILIKE 'TEST001'
    OR display_id SIMILAR TO '%TEST001%'; 