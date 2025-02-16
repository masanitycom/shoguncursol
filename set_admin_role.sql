-- 特定のユーザーを管理者に設定
UPDATE profiles
SET role = 'admin'
WHERE email = 'testadmin@gmail.com'  -- 実際の管理者メールアドレスに変更
RETURNING *;

-- 管理者権限の確認
SELECT 
    p.email,
    p.role,
    p.display_id
FROM profiles p
WHERE p.role = 'admin'; 