-- 外部キー制約を追加
ALTER TABLE nft_purchase_requests
ADD CONSTRAINT fk_user_profile
FOREIGN KEY (user_id) REFERENCES profiles(id);

-- インデックスを追加してパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_nft_purchase_requests_user_id 
ON nft_purchase_requests(user_id); 