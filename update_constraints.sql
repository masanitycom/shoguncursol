-- メールドメイン制約を追加（既存のgmail.comも許可）
ALTER TABLE profiles
ADD CONSTRAINT valid_email_domain 
CHECK (
    email IS NULL OR 
    email LIKE '%@shogun-trade.com' OR 
    email LIKE '%@example.com' OR
    email LIKE '%@gmail.com'  -- 既存のドメインを許可
);

-- 新規登録時のみ制限するトリガー
CREATE OR REPLACE FUNCTION check_new_email_domain()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email LIKE '%@gmail.com' THEN
        RAISE EXCEPTION 'New registrations must use shogun-trade.com or example.com domain';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_new_email_domain
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_new_email_domain(); 