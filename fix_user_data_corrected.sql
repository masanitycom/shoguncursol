BEGIN;

-- 1. まずusersテーブルに古いプロフィールのユーザーが存在するか確認
SELECT * FROM users 
WHERE id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 2. 存在しない場合は、usersテーブルにレコードを作成
INSERT INTO users (
    id,
    email,
    name,
    display_id,
    active,
    created_at,
    updated_at,
    user_id,
    name_kana,
    phone
) VALUES (
    '18064c40-1d4d-481e-95f8-ef76a0b705f0',
    'masataka.tak+ariran004@gmail.com',
    'アリラン',
    'ariran004',
    true,
    NOW(),
    NOW(),
    '18064c40-1d4d-481e-95f8-ef76a0b705f0',  -- user_idはidと同じ
    '',  -- name_kanaは必須だが空文字で対応
    ''   -- phoneは必須だが空文字で対応
)
ON CONFLICT (id) DO NOTHING;

-- 3. NFT購入リクエストを移動
UPDATE nft_purchase_requests
SET user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0'  -- 古いプロフィールのuser_id
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';  -- 新しいプロフィールのuser_id

-- 4. 新しいプロフィールを削除
DELETE FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 5. 新しいauth.usersレコードを削除
DELETE FROM auth.users
WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 6. 新しいusersレコードを削除
DELETE FROM users
WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 7. 最終確認
SELECT 
    p.user_id,
    p.display_id,
    p.name,
    p.email,
    p.referrer_id,
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