-- プロフィール作成のポリシーを修正
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
CREATE POLICY "Enable insert for new users" ON profiles
FOR INSERT TO public
WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id
    )
); 