DO $$ 
BEGIN
    -- 既存のテーブルが存在する場合は削除
    DROP TABLE IF EXISTS nft_daily_profits;

    -- nft_daily_profitsテーブルを作成
    CREATE TABLE nft_daily_profits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL UNIQUE,
        rate DECIMAL(5,2) NOT NULL,  -- daily_rateではなくrate
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- サンプルデータの挿入
    INSERT INTO nft_daily_profits (date, rate)
    SELECT 
        CURRENT_DATE - (n || ' days')::INTERVAL,
        0.5 + random() * 0.5
    FROM generate_series(0, 6) n
    ON CONFLICT (date) DO UPDATE 
    SET rate = EXCLUDED.rate;

    -- インデックスを作成
    CREATE INDEX IF NOT EXISTS idx_nft_daily_profits_date 
    ON nft_daily_profits(date);

    RAISE NOTICE 'NFT日利テーブルを修正しました';
END $$;
