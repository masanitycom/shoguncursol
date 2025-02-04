-- 1. auth.usersテーブルの確認
SELECT id, email, raw_user_meta_data
FROM auth.users
LIMIT 5;

-- 2. profilesテーブルの確認
SELECT id, name, email
FROM profiles
LIMIT 5;

-- 3. 購入リクエストとユーザー情報の関連を全て確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.status,
    au.email as auth_email,
    p.name as profile_name,
    p.email as profile_email,
    au.raw_user_meta_data->>'name' as meta_name
FROM nft_purchase_requests npr
LEFT JOIN profiles p ON npr.user_id = p.id
LEFT JOIN auth.users au ON npr.user_id = au.id
ORDER BY npr.created_at DESC;

-- 4. 不整合データの確認
SELECT 
    p.id,
    p.name as profile_name,
    p.email as profile_email,
    au.email as auth_email,
    au.raw_user_meta_data->>'name' as meta_name
FROM profiles p
FULL OUTER JOIN auth.users au ON p.id = au.id
WHERE p.name IS NULL 
   OR p.email IS NULL 
   OR p.name != COALESCE(au.raw_user_meta_data->>'name', au.email); 