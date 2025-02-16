-- プロフィールテーブルのポリシーを確認
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

-- プロフィールテーブルのRLSが有効か確認
SELECT 
    relname,
    relrowsecurity,
    relforcerowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- テストクエリ
SELECT 
    display_id,
    name,
    email
FROM profiles
WHERE display_id = 'TEST001'
OR display_id ILIKE 'TEST001'; 