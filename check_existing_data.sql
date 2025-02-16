-- 既存のメールアドレスの詳細を確認
SELECT 
    email,
    display_id,
    name,
    created_at
FROM profiles
WHERE email LIKE '%@gmail.com'
ORDER BY created_at DESC;

-- auth.usersテーブルとの整合性も確認
SELECT 
    p.email as profile_email,
    p.display_id,
    au.email as auth_email
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.email LIKE '%@gmail.com'; 