-- emailカラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- emailカラムを更新（auth.usersテーブルからデータをコピー）
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id; 