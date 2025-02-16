-- 紹介者IDの詳細な確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email,
    LENGTH(display_id) as id_length,
    POSITION(' ' in display_id) as has_space,
    ENCODE(CONVERT_TO(display_id, 'UTF8'), 'hex') as hex_display_id
FROM profiles
WHERE 
    display_id = 'TEST001'
    OR display_id ILIKE '%TEST001%'
    OR display_id SIMILAR TO '%TEST001%'
    OR display_id LIKE '%TEST001%'; 