-- 問題のあるプロフィールの詳細を確認
SELECT *
FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- auth.usersテーブルから正しい情報を取得
SELECT id, email, created_at
FROM auth.users
WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- プロフィールデータを更新
UPDATE profiles
SET 
    display_id = CASE 
        WHEN email LIKE '%@shogun-trade.com' THEN CONCAT('SG', SUBSTRING(MD5(user_id::text), 1, 6))
        ELSE CONCAT('USER', SUBSTRING(MD5(user_id::text), 1, 6))
    END,
    email = (SELECT email FROM auth.users WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'),
    name = CASE 
        WHEN name IS NULL THEN 'User ' || SUBSTRING(MD5(user_id::text), 1, 6)
        ELSE name 
    END,
    updated_at = NOW()
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 更新後のデータを確認
SELECT 
    user_id,
    display_id,
    email,
    name,
    updated_at
FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'; 