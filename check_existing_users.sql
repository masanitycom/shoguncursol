-- profilesテーブルの確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email,
    created_at
FROM profiles
WHERE display_id IN (
    'hanamaru05',
    'USER3946',
    'USER0a18',
    'dondon002',
    'ADMIN001',
    'TEST001'
)
ORDER BY created_at DESC;

-- usersテーブルの確認
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email IN (
    'example@shogun-trade.com',
    'torucajino@gmail.com',
    'masakuma1108@gmail.com',
    'masataka.tak+dondon@gmail.com',
    'testadmin@gmail.com',
    'testuser@gmail.com'
); 