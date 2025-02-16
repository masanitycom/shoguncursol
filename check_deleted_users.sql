-- 削除されたユーザーの確認
SELECT 
    au.id,
    au.email,
    au.deleted_at,
    p.display_id,
    p.email as profile_email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.email = 'ariran004@shogun-trade.com'
OR au.email LIKE '%ariran%'
OR au.deleted_at IS NOT NULL;

-- 必要に応じて、完全に削除
DELETE FROM auth.users
WHERE email = 'ariran004@shogun-trade.com';

DELETE FROM profiles
WHERE email = 'ariran004@shogun-trade.com'; 