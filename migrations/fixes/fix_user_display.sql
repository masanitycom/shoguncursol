-- まず、nft_purchase_requestsテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'nft_purchase_requests';

-- user_display_nameカラムが存在する場合のみ削除
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'nft_purchase_requests' 
        AND column_name = 'user_display_name'
    ) THEN
        ALTER TABLE nft_purchase_requests 
        DROP COLUMN user_display_name;
        RAISE NOTICE 'user_display_name column dropped';
    ELSE
        RAISE NOTICE 'user_display_name column does not exist';
    END IF;
END $$;

-- インデックスを追加（既存のインデックスと重複しないように確認）
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_id'
    ) THEN
        CREATE INDEX idx_profiles_id ON profiles(id);
        RAISE NOTICE 'idx_profiles_id index created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'nft_purchase_requests' 
        AND indexname = 'idx_nft_purchase_requests_user_id'
    ) THEN
        CREATE INDEX idx_nft_purchase_requests_user_id ON nft_purchase_requests(user_id);
        RAISE NOTICE 'idx_nft_purchase_requests_user_id index created';
    END IF;
END $$; 