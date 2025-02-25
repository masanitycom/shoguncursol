-- 既存のdaily_ratesテーブルのデータをバックアップ
CREATE TABLE daily_rates_backup AS SELECT * FROM daily_rates;

-- 外部キー制約を削除
ALTER TABLE daily_rates 
DROP CONSTRAINT IF EXISTS daily_rates_nft_id_fkey;

-- 不整合データを削除
DELETE FROM daily_rates 
WHERE nft_id NOT IN (SELECT id FROM nft_master);

-- 新しい外部キー制約を追加
ALTER TABLE daily_rates
ADD CONSTRAINT daily_rates_nft_id_fkey
FOREIGN KEY (nft_id) 
REFERENCES nft_master(id)
ON DELETE CASCADE;

-- profiles テーブルのカラム名を修正
ALTER TABLE profiles 
RENAME COLUMN team_investment TO total_team_investment;

-- 不足しているカラムがあれば追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS investment_amount decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_team_investment decimal DEFAULT 0;

-- profiles テーブルの構造を確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 既存のデータを確認
SELECT id, user_id, display_id, referrer_id, investment_amount, total_team_investment
FROM profiles
LIMIT 5;

-- 組織構造のための新しいカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referrer_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS display_id varchar(255) UNIQUE,
ADD COLUMN IF NOT EXISTS investment_amount decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_team_investment decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_line_investment decimal DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_lines_investment decimal DEFAULT 0;

-- インデックスを作成して検索を高速化
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_id ON profiles(referrer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_id ON profiles(display_id);
CREATE INDEX IF NOT EXISTS idx_profiles_investments ON profiles(max_line_investment, other_lines_investment);

-- nft_masterテーブルにdescriptionカラムを追加
ALTER TABLE nft_master
ADD COLUMN IF NOT EXISTS description TEXT;

-- nft_masterテーブルにtypeカラムを追加
ALTER TABLE nft_master
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'normal';

-- 既存のNFTを'normal'として設定
UPDATE nft_master
SET type = 'normal'
WHERE type IS NULL; 