DO $$ 
DECLARE
    temp_data RECORD;
BEGIN
    -- 既存のデータを一時的に保存
    CREATE TEMP TABLE IF NOT EXISTS temp_nft_purchases AS 
    SELECT * FROM nft_purchase_requests;

    -- 既存の外部キー制約を削除
    ALTER TABLE nft_purchase_requests 
    DROP CONSTRAINT IF EXISTS fk_nft,
    DROP CONSTRAINT IF EXISTS nft_purchase_requests_nft_id_fkey,
    DROP CONSTRAINT IF EXISTS fk_nft_setting;  -- 既存の制約も削除

    -- nft_settingsテーブルへの参照を追加（IF NOT EXISTSを追加）
    ALTER TABLE nft_purchase_requests
    ADD CONSTRAINT fk_nft_setting
    FOREIGN KEY (nft_id) 
    REFERENCES nft_settings(id)
    ON DELETE CASCADE;  -- 親レコードが削除された場合の動作を指定

    -- インデックスを作成
    DROP INDEX IF EXISTS idx_nft_purchase_requests_nft_id;
    CREATE INDEX idx_nft_purchase_requests_nft_id 
    ON nft_purchase_requests(nft_id);

    -- データを戻す（重複を避けるため、DISTINCT を使用）
    DELETE FROM nft_purchase_requests;
    INSERT INTO nft_purchase_requests 
    SELECT DISTINCT ON (id) *
    FROM temp_nft_purchases;

    -- 一時テーブルを削除
    DROP TABLE IF EXISTS temp_nft_purchases;
END $$; 