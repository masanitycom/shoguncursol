-- 1. まず既存のメールアドレスを確認
SELECT DISTINCT 
    SPLIT_PART(email, '@', 2) as domain,
    COUNT(*) as count
FROM profiles
WHERE email IS NOT NULL
GROUP BY domain;

-- 2. 既存のデータを更新（必要な場合）
UPDATE profiles
SET email = REPLACE(email, '@gmail.com', '@shogun-trade.com')
WHERE email LIKE '%@gmail.com';

-- 3. メールドメイン制約を追加（既存データ確認後）
ALTER TABLE profiles
ADD CONSTRAINT valid_email_domain 
CHECK (
    email IS NULL OR  -- NULLを許可
    email LIKE '%@shogun-trade.com' OR 
    email LIKE '%@example.com'
);

-- 4. プロフィールとユーザーの整合性を保つトリガー
CREATE OR REPLACE FUNCTION check_user_profile_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- emailがNULLの場合はチェックをスキップ
    IF NEW.email IS NULL THEN
        RETURN NEW;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = NEW.user_id 
        AND email = NEW.email
    ) THEN
        RAISE EXCEPTION 'User ID and email must match with auth.users';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 既存のトリガーを削除（もし存在する場合）
DROP TRIGGER IF EXISTS ensure_profile_consistency ON profiles;

-- 6. 新しいトリガーを作成
CREATE TRIGGER ensure_profile_consistency
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_user_profile_consistency();

-- 7. 確認クエリ
SELECT 
    p.email,
    p.display_id,
    au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE p.email IS NOT NULL; 