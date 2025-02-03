-- usersテーブルに必要なカラムが存在することを確認
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS wallet_type TEXT DEFAULT 'EVOカード'; 