-- 1. 既存のユーザーを確認
SELECT 
    au.id,
    au.email,
    p.display_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'ariran004@shogun-trade.com';

-- 2. プロフィールを削除
DELETE FROM profiles 
WHERE email = 'ariran004@shogun-trade.com';

-- 3. auth.usersから削除
DELETE FROM auth.users 
WHERE email = 'ariran004@shogun-trade.com'; 