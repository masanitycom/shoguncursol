-- 既存の外部キー制約をすべて削除
ALTER TABLE nft_purchase_requests
DROP CONSTRAINT IF EXISTS fk_nft_settings,
DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey,
DROP CONSTRAINT IF EXISTS fk_user,
DROP CONSTRAINT IF EXISTS fk_user_id;

-- 外部キー制約を確認して修正
DO $$ 
BEGIN
    -- nft_purchase_requests_nft_id_fkey の再作成
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'nft_purchase_requests_nft_id_fkey'
    ) THEN
        ALTER TABLE nft_purchase_requests
        ADD CONSTRAINT nft_purchase_requests_nft_id_fkey 
        FOREIGN KEY (nft_id) 
        REFERENCES nft_settings(id)
        ON DELETE CASCADE;
    END IF;

    -- インデックスの作成
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_nft_purchase_requests_nft_id'
    ) THEN
        CREATE INDEX idx_nft_purchase_requests_nft_id 
        ON nft_purchase_requests(nft_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_nft_purchase_requests_user_status'
    ) THEN
        CREATE INDEX idx_nft_purchase_requests_user_status 
        ON nft_purchase_requests(user_id, status);
    END IF;
END $$;

-- 制約とデータの整合性を確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    npr.nft_id,
    ns.id as settings_id,
    ns.name as nft_name
FROM nft_purchase_requests npr
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE ns.id IS NULL; 