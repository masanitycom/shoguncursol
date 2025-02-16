BEGIN;

-- 1. 両方のauth.usersレコードの詳細を確認
SELECT id, email, created_at, last_sign_in_at, confirmed_at
FROM auth.users 
WHERE id IN (
    '18064c40-1d4d-481e-95f8-ef76a0b705f0',  -- 古いプロフィール
    'b1de3e34-165f-4cd5-ae0d-602948ac0f65'   -- 新しいプロフィール
);

-- 2. 新しいプロフィールのNFT購入リクエストを移動する前に、
-- 一時的に古いauth.usersのメールアドレスを変更
UPDATE auth.users
SET email = 'masataka.tak+ariran004_old@gmail.com'
WHERE id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 3. NFT購入リクエストを古いプロフィールに移動
UPDATE nft_purchase_requests
SET user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0'  -- 古いプロフィールのuser_id
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';  -- 新しいプロフィールのuser_id

-- 4. 新しいプロフィールを削除
DELETE FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 5. 新しいauth.usersレコードを削除
DELETE FROM auth.users
WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 6. 古いauth.usersのメールアドレスを正しいものに戻す
UPDATE auth.users
SET email = 'masataka.tak+ariran004@gmail.com'
WHERE id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 7. 最終確認
SELECT 
    p.user_id,
    p.display_id,
    p.name,
    p.email,
    p.referrer_id,
    au.email as auth_email,
    npr.id as nft_request_id,
    npr.status as nft_status
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
LEFT JOIN nft_purchase_requests npr ON p.user_id = npr.user_id
WHERE p.user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

COMMIT; 