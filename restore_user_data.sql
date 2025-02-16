-- データを元の状態に戻す
UPDATE profiles
SET 
    display_id = 'ariran004',
    name = 'アリラン',
    referrer_id = (SELECT user_id FROM profiles WHERE display_id = 'TEST001'),
    updated_at = NOW()
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 更新後の確認
SELECT 
    p.user_id,
    p.display_id,
    p.name,
    p.email,
    r.display_id as referrer_display_id
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65'; 