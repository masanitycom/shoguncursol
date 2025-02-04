-- 1. 現在のプロファイル情報を確認
SELECT 
    p.id,
    p.name,
    p.email,
    p.updated_at,
    au.raw_user_meta_data->>'name_kana' as name_kana
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33';

-- 2. プロファイル名を更新
UPDATE profiles
SET name = 'ハナタロウ3',
    updated_at = NOW()
WHERE id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33';

-- 3. 購入リクエストのユーザー情報を確認
SELECT 
    npr.id,
    npr.status,
    npr.created_at,
    p.name as current_name,
    p.email,
    ns.name as nft_name,
    n.nft_type
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.id
JOIN nft_settings ns ON npr.nft_id = ns.id
LEFT JOIN nfts n ON npr.nft_id = n.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC; 