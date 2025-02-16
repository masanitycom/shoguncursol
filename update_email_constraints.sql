-- メールドメインの制約を更新
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_email_domain;

ALTER TABLE profiles
ADD CONSTRAINT valid_email_domain 
CHECK (
  email IS NULL OR 
  email LIKE '%@shogun-trade.com'  -- 本番環境のドメインのみ許可
);

-- 新規登録時のトリガーを更新
CREATE OR REPLACE FUNCTION check_new_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@shogun-trade.com' THEN
    RAISE EXCEPTION 'New registrations must use shogun-trade.com domain';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーが存在しない場合は作成
DROP TRIGGER IF EXISTS enforce_new_email_domain ON profiles;
CREATE TRIGGER enforce_new_email_domain
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_new_email_domain(); 