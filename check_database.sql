-- auth.usersテーブルの確認
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- profilesテーブルの確認
SELECT 
    id,
    user_id,
    display_id,
    email,
    name,
    created_at
FROM profiles
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 紹介者IDの関係を確認
SELECT 
    p.display_id,
    p.name,
    p.referrer_id,
    r.display_id as referrer_display_id,
    r.name as referrer_name
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.referrer_id IS NOT NULL; 