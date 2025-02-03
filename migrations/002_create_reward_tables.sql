-- 日次利益テーブル
CREATE TABLE IF NOT EXISTS daily_profits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_profit DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_daily_profits_date ON daily_profits(date);

-- NFT別日次利益テーブル
CREATE TABLE IF NOT EXISTS nft_daily_profits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_nft_id UUID NOT NULL REFERENCES user_nfts(id),
  date DATE NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  profit_amount DECIMAL(12,2) NOT NULL,
  is_airdropped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_nft_daily_profits ON nft_daily_profits(user_nft_id, date);

-- 報酬請求テーブル
CREATE TABLE IF NOT EXISTS reward_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reward_requests ON reward_requests(user_id, status);

-- ユーザー報酬テーブル
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  available_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_claim_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_rewards ON user_rewards(user_id);

-- 報酬請求履歴テーブル
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  request_id UUID NOT NULL REFERENCES reward_requests(id),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reward_claims ON reward_claims(user_id, status); 