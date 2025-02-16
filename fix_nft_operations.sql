-- 1. 不正なデータの確認
SELECT *
FROM nft_operations
WHERE user_id NOT IN (SELECT user_id FROM profiles)
   OR nft_id NOT IN (SELECT id FROM nft_master);

-- 2. 不正なデータの削除（必要な場合）
DELETE FROM nft_operations
WHERE user_id NOT IN (SELECT user_id FROM profiles)
   OR nft_id NOT IN (SELECT id FROM nft_master);

-- 3. ステータスの修正
UPDATE nft_operations
SET status = 'active'
WHERE status IS NULL;

-- 4. 金額の初期化（必要な場合）
UPDATE nft_operations
SET current_profit = 0
WHERE current_profit IS NULL;

-- 5. 不足している金額情報を設定
UPDATE nft_operations no
SET purchase_amount = nm.price
FROM nft_master nm
WHERE no.nft_id = nm.id
AND (no.purchase_amount IS NULL OR no.purchase_amount = 0);

-- 6. created_atが未設定の場合、現在時刻を設定
UPDATE nft_operations
SET created_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL; 