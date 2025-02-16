-- profilesテーブルの構造を確認・修正
DO $$ 
BEGIN
    -- 必要なカラムが存在しない場合は追加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'investment_amount') THEN
        ALTER TABLE profiles 
        ADD COLUMN investment_amount numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'max_line_investment') THEN
        ALTER TABLE profiles 
        ADD COLUMN max_line_investment numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'other_lines_investment') THEN
        ALTER TABLE profiles 
        ADD COLUMN other_lines_investment numeric DEFAULT 0;
    END IF;

    -- インデックスの作成
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'profiles' AND indexname = 'profiles_user_id_idx') THEN
        CREATE INDEX profiles_user_id_idx ON profiles(user_id);
    END IF;
END $$; 