-- usersテーブルのカラムを確認・修正
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS name_kana TEXT; 