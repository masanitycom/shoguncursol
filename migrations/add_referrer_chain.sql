-- referrer_chainカラムを追加
ALTER TABLE users 
ADD COLUMN referrer_chain uuid[] DEFAULT '{}';

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX idx_users_referrer_chain ON users USING gin(referrer_chain);

-- 既存データのreferrer_chainを更新するファンクション
CREATE OR REPLACE FUNCTION update_referrer_chain()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, referrer_id FROM users WHERE referrer_id IS NOT NULL
    LOOP
        WITH RECURSIVE chain AS (
            SELECT id, referrer_id, ARRAY[id] as chain
            FROM users
            WHERE id = r.referrer_id
            
            UNION ALL
            
            SELECT u.id, u.referrer_id, c.chain || u.id
            FROM users u
            INNER JOIN chain c ON u.id = c.referrer_id
        )
        UPDATE users
        SET referrer_chain = (
            SELECT chain
            FROM chain
            WHERE referrer_id IS NULL
            LIMIT 1
        )
        WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 