-- 既存ユーザーのdisplay_idを更新
UPDATE profiles 
SET 
    display_id = CASE 
        WHEN email = 'example@shogun-trade.com' THEN 'hanamaru05'
        WHEN email = 'torucajino@gmail.com' THEN 'USER3946'
        WHEN email = 'masakuma1108@gmail.com' THEN 'USER0a18'
        WHEN email = 'masataka.tak+dondon@gmail.com' THEN 'dondon002'
        WHEN email = 'testadmin@gmail.com' THEN 'ADMIN001'
        WHEN email = 'testuser@gmail.com' THEN 'TEST001'
    END
WHERE email IN (
    'example@shogun-trade.com',
    'torucajino@gmail.com',
    'masakuma1108@gmail.com',
    'masataka.tak+dondon@gmail.com',
    'testadmin@gmail.com',
    'testuser@gmail.com'
);

-- 更新後の確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email
FROM profiles
WHERE display_id IS NOT NULL; 