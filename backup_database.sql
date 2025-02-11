-- バックアップを取得
CREATE OR REPLACE FUNCTION backup_database()
RETURNS void AS $$
BEGIN
    -- ユーザーテーブルのバックアップ
    CREATE TABLE IF NOT EXISTS users_backup AS 
    SELECT * FROM users;
    
    -- NFT購入リクエストのバックアップ
    CREATE TABLE IF NOT EXISTS nft_purchase_requests_backup AS 
    SELECT * FROM nft_purchase_requests;
    
    -- 紹介者関係のバックアップ
    CREATE TABLE IF NOT EXISTS referral_relationships_backup AS 
    SELECT 
        u.id,
        u.referrer_id,
        u.username,
        u.total_investment
    FROM users u;
    
    RAISE NOTICE 'バックアップが完了しました';
END;
$$ LANGUAGE plpgsql; 