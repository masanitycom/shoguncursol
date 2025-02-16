-- profilesテーブルでTEST001を検索
SELECT 
    id,
    user_id,
    display_id,
    email,
    name
FROM profiles 
WHERE display_id = 'TEST001'
OR display_id ILIKE '%TEST001%';

-- usersテーブルでも念のため確認
SELECT 
    id,
    email,
    display_id,
    name
FROM users 
WHERE display_id = 'TEST001'
OR display_id ILIKE '%TEST001%'; 