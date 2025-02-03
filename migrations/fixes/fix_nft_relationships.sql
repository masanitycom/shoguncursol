DO $$ 
BEGIN
    -- 既存の外部キー制約をすべて削除
    ALTER TABLE nft_purchase_requests 
    DROP CONSTRAINT IF EXISTS fk_nft_setting,
    DROP CONSTRAINT IF EXISTS fk_nft_settings,
    DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey;

    -- 単一の外部キー制約を追加
    ALTER TABLE nft_purchase_requests
    ADD CONSTRAINT fk_nft_settings
    FOREIGN KEY (nft_id)
    REFERENCES nft_settings(id);

    RAISE NOTICE 'リレーションシップの修正が完了しました';
END $$;
