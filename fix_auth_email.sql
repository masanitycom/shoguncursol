BEGIN;

-- 1. 現在のauth.usersの状態を確認
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 2. auth.usersのメールアドレスを更新
UPDATE auth.users
SET 
    email = 'masataka.tak+ariran004@gmail.com',
    updated_at = NOW()
WHERE id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 3. 最終確認
SELECT 
    p.user_id,
    p.display_id,
    p.name,
    p.email as profile_email,
    u.email as users_email,
    au.email as auth_email,
    npr.id as nft_request_id,
    npr.status as nft_status
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN nft_purchase_requests npr ON p.user_id = npr.user_id
WHERE p.user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

COMMIT; 