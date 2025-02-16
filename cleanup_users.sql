-- 1. 不正なユーザーを削除
DELETE FROM auth.users
WHERE email IN (
    'ariran@shogun-trade.com',
    'ariran004@shogun-trade.com'
);

-- 2. profilesテーブルがないユーザーを削除
DELETE FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.user_id = au.id
)
AND au.email LIKE '%@shogun-trade.com';

-- 3. 確認クエリ
SELECT 
    au.id,
    au.email as auth_email,
    p.email as profile_email,
    p.display_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email LIKE '%@shogun-trade.com'; 