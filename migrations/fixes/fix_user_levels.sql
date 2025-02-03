DO $$ 
BEGIN
    -- 既存のテーブルを削除
    DROP TABLE IF EXISTS user_levels;

    -- テーブルを再作成
    CREATE TABLE user_levels (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        max_line INTEGER NOT NULL DEFAULT 0,
        other_lines INTEGER NOT NULL DEFAULT 0,
        personal_investment DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 既存のユーザーに対してレコードを作成
    INSERT INTO user_levels (id)
    SELECT id FROM auth.users
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'ユーザーレベルテーブルを修正しました';
END $$;
