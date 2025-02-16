-- 現在のデータを確認（変更前）
SELECT 
    user_id,
    display_id,
    email,
    name
FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- emailのみを更新
UPDATE profiles
SET 
    email = (SELECT email FROM auth.users WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'),
    updated_at = NOW()
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 更新後の確認
SELECT 
    user_id,
    display_id,
    email,
    name
FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'; 