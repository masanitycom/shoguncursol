-- 紹介者関係を確認
SELECT 
    p.display_id,
    p.name,
    p.email,
    p.referrer_id,
    r.display_id as referrer_display_id,
    r.name as referrer_name
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
ORDER BY p.created_at;

-- アクティブなユーザーのみを確認
SELECT 
    p.display_id,
    p.name,
    p.email,
    p.active,
    p.referrer_id,
    r.display_id as referrer_display_id
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.active = true
ORDER BY p.created_at; 