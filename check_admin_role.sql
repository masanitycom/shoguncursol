-- 管理者ユーザーの確認
SELECT 
    p.user_id,
    p.email,
    p.display_id,
    p.role,
    au.email as auth_email
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.email = 'testadmin@gmail.com'
   OR au.email = 'testadmin@gmail.com';

-- 管理者権限の再設定
UPDATE profiles
SET role = 'admin'
WHERE email = 'testadmin@gmail.com'
RETURNING *;

-- 管理者ユーザーの認証情報を確認
SELECT 
    id,
    email,
    confirmed_at,
    last_sign_in_at,
    role
FROM auth.users
WHERE email = 'testadmin@gmail.com'; 