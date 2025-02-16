-- 1. 既存のauth.usersレコードを削除
DELETE FROM auth.users
WHERE email = 'ariran004@shogun-trade.com';

-- 2. 確認クエリ
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
WHERE email = 'ariran004@shogun-trade.com'
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
WHERE email = 'ariran004@shogun-trade.com'; 