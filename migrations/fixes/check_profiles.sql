-- profilesテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 必要なカラムがない場合は追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- nft_purchase_requestsテーブルの構造も確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    npr.status,
    npr.created_at,
    npr.approved_at,
    p.name,
    p.email,
    ns.name as nft_name,
    ns.price as nft_price
FROM nft_purchase_requests npr
LEFT JOIN profiles p ON npr.user_id = p.id
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
LIMIT 5; 