-- 既存のポリシーを削除
DROP POLICY IF EXISTS "プロフィールの作成を許可" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールの読み取りを許可" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールの更新を許可" ON profiles;

-- RLSを一時的に無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成
CREATE POLICY "Enable all access for authenticated users" ON profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールテーブルの権限を確認・修正
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 