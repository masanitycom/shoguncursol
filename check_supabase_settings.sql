-- 1. profilesテーブルの外部キー制約を確認
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'profiles';

-- 2. RLSポリシーを確認
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

-- 3. profilesテーブルの現在の権限を確認
SELECT 
    grantee, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- 4. トリガーの確認
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 5. profilesテーブルの構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    identity_generation
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. auth.usersテーブルとprofilesの同期状態を確認
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.user_id as profile_user_id,
    p.email as profile_email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'ariran004@shogun-trade.com'
   OR p.email = 'ariran004@shogun-trade.com';

-- 7. RLSが有効になっているか確認
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'profiles'; 