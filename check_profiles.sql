-- すべてのprofilesを確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email
FROM profiles;

-- 特に、auth.usersに対応するprofilesを確認
SELECT 
    p.id,
    p.user_id,
    p.display_id,
    p.name,
    p.email,
    u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC; 