-- テーブル構造の確認
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('nft_purchase_requests', 'profiles', 'nft_settings');

-- 外部キー制約の確認
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';

-- プロファイルテーブルがない場合は作成
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 外部キー制約を追加
ALTER TABLE nft_purchase_requests
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- 既存のユーザーのプロファイルを作成
INSERT INTO profiles (id, email, display_name)
SELECT 
    id,
    email,
    raw_user_meta_data->>'name' as display_name
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;

-- NFT購入リクエストとNFT設定の関連を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    ns.id as nft_settings_id,
    ns.name,
    ns.price,
    ns.daily_rate
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE npr.status = 'approved'
LIMIT 5;

-- user_nftsテーブルの構造と内容を確認
SELECT 
    un.id,
    un.user_id,
    un.nft_type_id,
    un.is_active,
    ns.name,
    ns.price,
    ns.daily_rate
FROM user_nfts un
LEFT JOIN nft_settings ns ON un.nft_type_id = ns.id
LIMIT 5; 