-- 1. auth.usersテーブルでの確認
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'ariran004@shogun-trade.com';

-- 2. profilesテーブルでの確認
SELECT 
    id,
    user_id,
    display_id,
    name,
    email,
    referrer_id,
    created_at
FROM profiles 
WHERE email = 'ariran004@shogun-trade.com';

-- 3. 紹介者関係の確認
SELECT 
    p.display_id as user_display_id,
    p.email as user_email,
    r.display_id as referrer_display_id,
    r.email as referrer_email
FROM profiles p
LEFT JOIN profiles r ON p.referrer_id = r.user_id
WHERE p.email = 'ariran004@shogun-trade.com';

-- 4. TEST001の情報確認
SELECT 
    id,
    user_id,
    display_id,
    email
FROM profiles
WHERE display_id = 'TEST001'; 