-- 管理者ユーザーの確認と更新
UPDATE profiles 
SET role = 'admin'
WHERE email = 'testadmin@gmail.com'
RETURNING id, user_id, email, role;

-- 更新後の確認
SELECT 
    au.id as auth_id,
    au.email,
    p.id as profile_id,
    p.user_id,
    p.role,
    p.email as profile_email
FROM auth.users au
JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'testadmin@gmail.com'; 