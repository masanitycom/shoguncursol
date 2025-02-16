-- プロフィールテーブルにroleカラムが存在することを確認
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 既存の管理者ユーザーのroleを更新
UPDATE profiles 
SET role = 'admin'
WHERE email = 'testadmin@gmail.com';

-- RLSポリシーの更新
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 管理者用のポリシーを追加/更新
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
CREATE POLICY "Admin users can view all profiles" ON profiles
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    );

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 変更を確認
SELECT * FROM profiles WHERE role = 'admin'; 