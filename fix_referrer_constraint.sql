-- user_idにUNIQUE制約を追加
ALTER TABLE profiles
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 既存の制約を削除
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_referrer_id_fkey;

-- 正しい制約を追加
ALTER TABLE profiles 
ADD CONSTRAINT profiles_referrer_id_fkey 
FOREIGN KEY (referrer_id) 
REFERENCES profiles(user_id)
ON DELETE SET NULL;  -- 紹介者が削除された場合はNULLに設定

-- 制約を確認
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;

-- テストクエリ
SELECT 
    p.display_id,
    p.name,
    p.user_id,
    r.display_id as referrer_display_id,
    r.name as referrer_name
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.display_id = 'TEST001'
   OR r.display_id = 'TEST001'; 