-- 天下統一ボーナス関連のテーブル追加
CREATE TABLE IF NOT EXISTS weekly_company_profits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start_date DATE NOT NULL,
    profit_amount NUMERIC NOT NULL,
    distribution_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_unification_bonus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    week_start_date DATE NOT NULL,
    level VARCHAR NOT NULL,
    bonus_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_organization_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    week_start_date DATE NOT NULL,
    max_line_amount NUMERIC DEFAULT 0,
    other_lines_total NUMERIC DEFAULT 0,
    level VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, week_start_date)
);

-- 既存テーブルの修正
ALTER TABLE nft_types
ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_earnings_percent NUMERIC DEFAULT 300;

ALTER TABLE user_nfts
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS earnings_percent NUMERIC DEFAULT 0; 