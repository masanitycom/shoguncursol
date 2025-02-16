-- 1. statusカラムを追加
ALTER TABLE nft_operations
ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;

-- 2. purchase_amountカラムを追加（base_valueを使用）
ALTER TABLE nft_operations
RENAME COLUMN base_value TO purchase_amount;

-- 3. current_profitカラムを追加（current_valueを使用）
ALTER TABLE nft_operations
RENAME COLUMN current_value TO current_profit;

-- 4. インデックスを作成してパフォーマンスを改善
CREATE INDEX IF NOT EXISTS idx_nft_operations_user_id ON nft_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_operations_status ON nft_operations(status);

-- 5. 確認クエリ
SELECT 
    no.id,
    no.user_id,
    no.nft_id,
    no.status,
    no.purchase_amount,
    no.current_profit,
    no.created_at,
    no.last_claim_date
FROM nft_operations no
WHERE no.user_id = 'あなたのユーザーID'
ORDER BY no.created_at DESC; 