-- 古いプロフィールを確認（保持するべきプロフィール）
SELECT * FROM profiles 
WHERE user_id = '18064c40-1d4d-481e-95f8-ef76a0b705f0';

-- 新しいプロフィールを確認（削除するべきプロフィール）
SELECT * FROM profiles
WHERE user_id = 'b1de3e34-165f-4cd5-ae0d-602948ac0f65';

-- NFT購入リクエストやその他の関連データを確認
SELECT * FROM nft_purchase_requests
WHERE user_id IN (
    'b1de3e34-165f-4cd5-ae0d-602948ac0f65',
    '18064c40-1d4d-481e-95f8-ef76a0b705f0'
); 