-- テーブル名を確認
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- nft_settingsテーブルの構造を確認
\d nft_settings 