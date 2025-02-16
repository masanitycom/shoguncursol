-- 管理者ユーザーの状態を確認
SELECT 
    auth.users.id,
    auth.users.email,
    profiles.role,
    profiles.active,
    profiles.created_at
FROM auth.users
LEFT JOIN profiles ON auth.users.id = profiles.user_id
WHERE profiles.role = 'admin'
OR auth.users.email = 'testadmin@gmail.com';

-- すべてのポリシーを一旦削除
DROP POLICY IF EXISTS "Admin access policy" ON profiles;
DROP POLICY IF EXISTS "User access policy" ON profiles;
DROP POLICY IF EXISTS "Public read policy" ON profiles;

-- RLSを一時的に無効化
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 管理者の状態を確認・修正
UPDATE profiles
SET 
    role = 'admin',
    active = true,
    user_id = '83f0dbdd-87fc-430b-8204-426fd85dfae2'  -- auth.usersのIDと一致させる
WHERE email = 'testadmin@gmail.com';

-- 確認
SELECT 
    p.id,
    p.email,
    p.role,
    p.active,
    p.user_id,
    au.email as auth_email,
    au.id as auth_id
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.role = 'admin';

-- RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザー用の基本ポリシー
CREATE POLICY "Authenticated user access" ON profiles
    FOR ALL
    TO authenticated
    USING (
        -- 自分のプロフィール、または管理者の場合
        user_id = auth.uid()
        OR 
        auth.email() = 'testadmin@gmail.com'
    );

-- 未認証ユーザー用の制限付き読み取りポリシー
CREATE POLICY "Public limited read" ON profiles
    FOR SELECT
    TO public
    USING (
        active = true
    );

-- ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- プロフィールの参照を確認
SELECT 
    role, 
    active 
FROM profiles 
WHERE user_id = '83f0dbdd-87fc-430b-8204-426fd85dfae2';

-- インデックスの更新
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_user_id;
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- プロファイルテーブルのロール列の制約を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'role';

-- 既存の制約を削除してから追加
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS valid_role;

-- roleカラムの制約を追加
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'user',
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'user'));

-- 変更を確認
SELECT 
    id,
    email,
    role,
    active,
    created_at,
    updated_at
FROM profiles
WHERE role = 'admin';

-- roleカラムの新しい構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'role';

-- 管理者ユーザーの設定を確認
SELECT 
    id,
    email,
    role,
    active,
    created_at
FROM profiles
WHERE email = 'testadmin@gmail.com'; 