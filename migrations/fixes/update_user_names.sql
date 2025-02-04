-- 既存の購入リクエストのユーザー名を更新
WITH user_profiles AS (
    SELECT 
        p.id,
        p.name,
        p.email,
        u.email as auth_email
    FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
)
UPDATE nft_purchase_requests npr
SET user_display_name = COALESCE(up.name, up.email, up.auth_email, 'Unknown User')
FROM user_profiles up
WHERE npr.user_id = up.id;

-- プロファイル情報が不足している場合は auth.users から補完
INSERT INTO profiles (id, name, email)
SELECT 
    u.id,
    COALESCE(p.name, u.email) as name,
    u.email
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) 
DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;

-- 既存のプロファイルでemailが未設定の場合を更新
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id 
AND p.email IS NULL;

-- まず、既存のデータを確認
SELECT 
    p.id,
    p.name,
    p.email,
    au.raw_user_meta_data->>'name_kana' as name_kana
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.name IS NULL;

-- profilesテーブルのnameを更新（name_kanaを使用）
UPDATE profiles p
SET name = COALESCE(
    p.name,  -- 既存の名前があれば保持
    au.raw_user_meta_data->>'name_kana',  -- なければname_kanaを使用
    au.email  -- どちらもなければemailを使用
)
FROM auth.users au
WHERE p.id = au.id
AND p.name IS NULL;  -- 既存の名前がない場合のみ更新

-- 更新後のデータを確認
SELECT 
    p.id,
    p.name,
    p.email,
    au.raw_user_meta_data->>'name_kana' as name_kana
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.name IS NOT NULL; 