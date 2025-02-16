-- 1. 現在のポリシーを確認
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

-- 2. 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Must have corresponding auth user" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3. 新しいポリシーを作成
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT TO public
WITH CHECK (
    -- 認証済みユーザーの場合
    (auth.role() = 'authenticated' AND auth.uid() = user_id)
    OR
    -- 新規登録の場合
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id
    )
);

-- 4. 他の必要なポリシーを再作成
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT TO public
USING (true);

CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. RLSが有効になっていることを確認
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. 変更後のポリシーを確認
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