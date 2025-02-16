-- プロファイルテーブルのロール列にデフォルト値と制約を追加
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'user',
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'user'));

-- 管理者ユーザーのロールを確実に設定
UPDATE profiles
SET 
    role = 'admin',
    active = true,
    updated_at = NOW()
WHERE user_id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'testadmin@gmail.com'
);

-- RLSポリシーの確認と修正
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by users who created them." ON profiles;
CREATE POLICY "Profiles are viewable by users who created them."
ON profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile."
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 管理者用の特別なポリシーを追加
DROP POLICY IF EXISTS "Admins have full access" ON profiles;
CREATE POLICY "Admins have full access"
ON profiles
TO authenticated
USING ((SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'); 