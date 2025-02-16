-- 管理者ユーザーの確認
SELECT 
    au.id,
    au.email,
    p.role,
    p.user_id
FROM auth.users au
JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'testadmin@gmail.com';

-- profilesテーブルの構造確認
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'; 