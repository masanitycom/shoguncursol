-- 不足しているprofilesレコードを作成
INSERT INTO profiles (
    id,
    user_id,
    display_id,
    name,
    email,
    created_at,
    updated_at
)
SELECT 
    id,
    id as user_id,
    CASE 
        WHEN email = 'torucajino@gmail.com' THEN 'USER3946'
        WHEN email = 'masakuma1108@gmail.com' THEN 'USER0a18'
        WHEN email = 'testadmin@gmail.com' THEN 'ADMIN001'
        WHEN email = 'testuser@gmail.com' THEN 'TEST001'
    END as display_id,
    CASE 
        WHEN email = 'torucajino@gmail.com' THEN 'オジマトオル'
        WHEN email = 'masakuma1108@gmail.com' THEN 'タカクマサシン'
        WHEN email = 'testadmin@gmail.com' THEN '未設定'
        WHEN email = 'testuser@gmail.com' THEN 'ハナタロウ3'
    END as name,
    email,
    NOW(),
    NOW()
FROM auth.users
WHERE email IN (
    'torucajino@gmail.com',
    'masakuma1108@gmail.com',
    'testadmin@gmail.com',
    'testuser@gmail.com'
)
AND NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.users.id
);

-- 作成後の確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email
FROM profiles
WHERE display_id IS NOT NULL
ORDER BY created_at DESC; 