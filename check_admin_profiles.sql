-- 管理者ユーザーの確認
SELECT 
    auth.users.id,
    auth.users.email,
    profiles.role,
    profiles.active,
    profiles.created_at
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.user_id
WHERE profiles.role = 'admin'
ORDER BY profiles.created_at DESC;

-- プロフィールテーブルの構造確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- RLSポリシーの確認
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'; 