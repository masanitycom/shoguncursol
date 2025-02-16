-- profiles テーブルに role カラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 既存の管理者アカウントを設定
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';  -- 実際の管理者メールアドレスに変更してください 