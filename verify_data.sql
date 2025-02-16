-- TEST001の詳細な確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email,
    TRIM(display_id) as trimmed_id,
    LENGTH(display_id) as id_length,
    POSITION(' ' in display_id) as has_space,
    ENCODE(CONVERT_TO(display_id, 'UTF8'), 'hex') as hex_id
FROM profiles
WHERE display_id ILIKE '%TEST001%'
OR display_id = 'TEST001'; 