-- profilesテーブルのポリシーを修正
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロフィールの作成を許可"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のプロフィールの読み取りを許可"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "自分のプロフィールの更新を許可"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);

-- nft_operationsテーブルの外部キー制約を修正
ALTER TABLE nft_operations
ADD CONSTRAINT fk_nft
FOREIGN KEY (nft_id) 
REFERENCES nft_settings(id); 