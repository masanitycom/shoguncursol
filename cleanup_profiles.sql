-- 1. NULLレコードを削除
DELETE FROM profiles 
WHERE display_id IS NULL 
   OR name IS NULL 
   OR email IS NULL;

-- 2. アクティブなユーザーのみを確認
SELECT 
    display_id,
    name,
    email,
    active,
    referrer_id,
    created_at
FROM profiles
WHERE display_id IS NOT NULL
ORDER BY created_at;

-- 3. activeフラグを設定
UPDATE profiles
SET active = true
WHERE display_id IS NOT NULL; 