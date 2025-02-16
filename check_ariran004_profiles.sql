-- ariran004に関連するプロフィールを確認
SELECT 
    user_id,
    display_id,
    email,
    name,
    created_at
FROM profiles
WHERE display_id = 'ariran004'
OR email LIKE '%ariran004%'
ORDER BY created_at DESC;

-- 重複している可能性のあるプロフィールを確認
SELECT 
    p.user_id,
    p.display_id,
    p.email,
    p.name,
    au.email as auth_email,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.display_id = 'ariran004'
OR au.email LIKE '%ariran004%'
ORDER BY p.created_at DESC; 