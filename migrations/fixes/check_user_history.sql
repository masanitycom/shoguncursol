-- プロファイルの変更履歴を確認
SELECT 
    p.id,
    p.name,
    p.email,
    p.updated_at,
    au.raw_user_meta_data->>'name_kana' as name_kana,
    au.email as auth_email
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'  -- "ハナタロウ2"のユーザーID
ORDER BY p.updated_at DESC;

-- 購入リクエストの情報も確認
SELECT 
    npr.id,
    npr.user_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    p.name as profile_name,
    p.email as profile_email,
    au.raw_user_meta_data->>'name_kana' as name_kana
FROM nft_purchase_requests npr
JOIN profiles p ON npr.user_id = p.id
JOIN auth.users au ON p.id = au.id
WHERE npr.user_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
ORDER BY npr.created_at DESC; 