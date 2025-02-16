-- 1. 保持するユーザーのIDを配列で定義
WITH keep_users AS (
  SELECT display_id
  FROM profiles
  WHERE display_id IN (
    'hanamaru05',
    'USER3946',
    'USER0a18',
    'dondon002',
    'ADMIN001',
    'TEST001'
  )
)

-- 2. 保持するユーザー以外を削除
DELETE FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 
  FROM profiles p 
  JOIN keep_users k ON p.display_id = k.display_id 
  WHERE p.user_id = au.id
);

-- 3. プロフィールも同様に削除
DELETE FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 
  FROM keep_users k 
  WHERE p.display_id = k.display_id
);

-- 4. 確認クエリ
SELECT 
  p.display_id,
  p.email,
  p.created_at,
  au.email as auth_email
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
ORDER BY p.created_at DESC; 