-- 1. 新規登録に関連する競合するポリシーのみを削除
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for new users" ON profiles;

-- 2. 新規登録用のポリシーを作成
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT TO public
WITH CHECK (
    -- 新規登録の場合
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id
    )
    OR
    -- 認証済みユーザーの場合（管理者による作成など）
    (auth.role() = 'authenticated' AND 
     (auth.uid() = user_id OR 
      auth.jwt() ->> 'email' = 'testadmin@gmail.com'))
);

-- 3. 変更後のポリシーを確認
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname; 