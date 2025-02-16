-- まず既存のテーブルとポリシーを確認
DO $$ 
BEGIN
    -- 既存のポリシーをすべて削除
    DROP POLICY IF EXISTS "Admin can do anything" ON profiles;
    DROP POLICY IF EXISTS "Allow public read access for referrer lookup" ON profiles;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
    DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

    -- RLSを再設定
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

    -- 新しいポリシーを作成
    -- 1. 管理者用ポリシー
    CREATE POLICY "Admin can do anything"
        ON profiles
        FOR ALL
        TO authenticated
        USING ((auth.jwt() ->> 'email'::text) = 'testadmin@gmail.com'::text)
        WITH CHECK ((auth.jwt() ->> 'email'::text) = 'testadmin@gmail.com'::text);

    -- 2. 一般ユーザー用ポリシー
    CREATE POLICY "Users can manage own profile"
        ON profiles
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    -- 3. 紹介者検索用の公開読み取りポリシー
    CREATE POLICY "Allow public read access for referrer lookup"
        ON profiles
        FOR SELECT
        TO public
        USING (true);

    -- 権限を付与
    GRANT ALL ON profiles TO authenticated;
    GRANT ALL ON profiles TO service_role;
    GRANT SELECT ON profiles TO public;
    
END $$; 

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_amount DECIMAL(10,2) DEFAULT 0,
    max_line_investment DECIMAL(10,2) DEFAULT 0,
    other_lines_investment DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
); 