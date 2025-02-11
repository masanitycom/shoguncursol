-- profilesテーブルに投資額関連のカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS investment_amount DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_team_investment DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_line_investment DECIMAL(20,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_lines_investment DECIMAL(20,2) DEFAULT 0;

-- 既存のユーザーデータを更新
UPDATE profiles p
SET investment_amount = COALESCE(
    (SELECT SUM(npr.price)
     FROM nft_purchase_requests npr
     WHERE npr.user_id = p.user_id
     AND npr.status = 'approved'
    ), 0
);

-- インデックスを作成してパフォーマンスを改善
CREATE INDEX IF NOT EXISTS idx_profiles_investment_amount ON profiles(investment_amount);
CREATE INDEX IF NOT EXISTS idx_profiles_total_team_investment ON profiles(total_team_investment); 