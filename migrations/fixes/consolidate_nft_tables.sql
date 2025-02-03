-- 1. nft_settingsテーブルに必要なカラムを追加
ALTER TABLE nft_settings
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS last_transferred_at TIMESTAMPTZ;

-- 2. nftsテーブルからデータを移行
INSERT INTO nft_settings (
    id,
    name,
    price,
    daily_rate,
    image_url,
    description,
    status,
    owner_id,
    last_transferred_at
)
SELECT 
    id,
    name,
    price,
    daily_rate,
    image_url,
    description,
    status,
    owner_id,
    last_transferred_at
FROM nfts
ON CONFLICT (id) 
DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    daily_rate = EXCLUDED.daily_rate,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    owner_id = EXCLUDED.owner_id,
    last_transferred_at = EXCLUDED.last_transferred_at;

-- 3. データの整合性を確認
SELECT * FROM nft_settings;

-- 4. nft_purchase_requestsのnft_idの参照先を確認
ALTER TABLE nft_purchase_requests
DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey,
ADD CONSTRAINT nft_purchase_requests_nft_id_fkey 
    FOREIGN KEY (nft_id) 
    REFERENCES nft_settings(id);

-- 5. 不要になったnftsテーブルを削除（データ移行確認後）
-- DROP TABLE IF EXISTS nfts; 