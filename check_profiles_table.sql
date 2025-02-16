-- プロフィールテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- プロフィール作成のテストクエリ
INSERT INTO profiles (
    user_id,
    display_id,
    name,
    email,
    referrer_id,
    created_at,
    updated_at
) VALUES (
    'ca855159-697f-41b6-bf26-0a9dfa5bc0ac',
    'ariran004',
    'アリラン',
    'ariran004@shogun-trade.com',
    'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33',
    NOW(),
    NOW()
) RETURNING *;

-- 制約を確認
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass; 