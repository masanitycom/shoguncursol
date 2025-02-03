DO $$ 
BEGIN
    -- user_nftsテーブルの外部キー制約を確認・修正
    ALTER TABLE user_nfts
    DROP CONSTRAINT IF EXISTS user_nfts_user_id_fkey;

    -- 正しい外部キー制約を追加
    ALTER TABLE user_nfts
    ADD CONSTRAINT user_nfts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

    -- インデックスを作成
    CREATE INDEX IF NOT EXISTS idx_user_nfts_user_id
    ON user_nfts(user_id);

    RAISE NOTICE 'user_nftsテーブルのリレーションシップを修正しました';
END $$; 