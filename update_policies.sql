-- プロフィールテーブルのポリシーを更新
DROP POLICY IF EXISTS "プロフィールの作成を許可" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールの読み取りを許可" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールの更新を許可" ON profiles;

CREATE POLICY "プロフィールの作成を許可"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のプロフィールの読み取りを許可"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "自分のプロフィールの更新を許可"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- プロフィールテーブルのRLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 