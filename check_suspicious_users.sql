-- 1. auth.usersテーブルでの確認
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    confirmed_at
FROM auth.users 
WHERE email LIKE '%ariran%'
OR email LIKE '%shogun-trade.com';

-- 2. profilesテーブルでの確認
SELECT 
    id,
    user_id,
    email,
    display_id,
    name,
    created_at
FROM profiles 
WHERE email LIKE '%ariran%'
OR email LIKE '%shogun-trade.com';

-- 3. 最近登録されたユーザーの確認
SELECT 
    au.id,
    au.email as auth_email,
    au.created_at as auth_created,
    p.email as profile_email,
    p.display_id,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;

-- 4. メールドメインごとのユーザー数
SELECT 
    SPLIT_PART(email, '@', 2) as domain,
    COUNT(*) as user_count
FROM auth.users
GROUP BY domain
ORDER BY user_count DESC; 