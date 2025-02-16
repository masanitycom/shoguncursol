BEGIN;

-- 1. NFT購入リクエストを古いプロフィールに移動
UPDATE nft_purchase_requests
SET user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0'  -- 古いプロフィールのuser_id
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';  -- 新しいプロフィールのuser_id

-- 2. 新しいプロフィールを削除
DELETE FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 3. auth.usersテーブルの重複ユーザーを削除
DELETE FROM auth.users
WHERE id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- 4. 最終確認
SELECT 
    p.user_id,
    p.display_id,
    p.name,
    p.email,
    p.referrer_id,
    npr.id as nft_request_id,
    npr.status as nft_status
FROM profiles p
LEFT JOIN nft_purchase_requests npr ON p.user_id = npr.user_id
WHERE p.user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

COMMIT; 