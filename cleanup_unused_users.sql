-- 1. 保持するユーザーを確認
SELECT 
    p.display_id,
    p.email,
    au.email as auth_email,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.display_id IN (
    'hanamaru05',
    'USER3946',
    'USER0a18',
    'dondon002',
    'ADMIN001',
    'TEST001'
);

-- 2. 確認後、不要なユーザーを削除
DELETE FROM auth.users
WHERE email NOT IN (
    'example@shogun-trade.com',
    'torucajino@gmail.com',
    'masakuma1108@gmail.com',
    'masataka.tak+dondon@gmail.com',
    'testadmin@gmail.com',
    'testuser@gmail.com'
); 