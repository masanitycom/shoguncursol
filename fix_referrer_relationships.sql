-- 1. まず現在の状態を確認
SELECT 
    p.display_id,
    p.user_id,
    p.referrer_id,
    r.display_id as referrer_display_id
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.id
WHERE p.display_id = 'ariran004';

-- 2. TEST001のuser_idを確認
SELECT 
    id,
    user_id,
    display_id
FROM profiles
WHERE display_id = 'TEST001';

-- 3. 紹介者IDを正しいuser_idに更新
UPDATE profiles
SET referrer_id = (
    SELECT user_id 
    FROM profiles 
    WHERE display_id = 'TEST001'
)
WHERE display_id = 'ariran004';

-- 4. 更新後の確認
SELECT 
    p.display_id,
    p.name,
    p.email,
    p.referrer_id,
    r.display_id as referrer_display_id,
    r.name as referrer_name
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.display_id = 'ariran004'
   OR p.display_id = 'TEST001'; 