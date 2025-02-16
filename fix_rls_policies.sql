-- まず既存のポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 既存のポリシーを削除（必要な場合）
DROP POLICY IF EXISTS "Allow public read access for referrer lookup" ON profiles;

-- 未認証ユーザー用の制限付き読み取りポリシー
CREATE POLICY "Allow public read access for referrer lookup"
ON profiles
FOR SELECT
TO public
USING (true);  -- または必要に応じて制限を追加

-- 既存のポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- テストクエリ
SELECT 
    display_id,
    name,
    user_id
FROM profiles 
WHERE display_id = 'TEST001'; 