-- 1. auth.usersテーブルの確認
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    confirmed_at
FROM auth.users
WHERE email LIKE '%ariran004%'
OR email LIKE '%masataka.tak%';

-- 2. profilesテーブルの確認
SELECT *
FROM profiles
WHERE email LIKE '%ariran004%'
OR email LIKE '%masataka.tak%';

-- 3. 認証状態の確認
SELECT 
    au.id,
    au.email,
    au.confirmed_at,
    p.display_id,
    p.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email LIKE '%ariran004%'
OR au.email LIKE '%masataka.tak%'; 