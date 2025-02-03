-- 購入リクエストが承認された時にNFTの所有者を更新するトリガー
CREATE OR REPLACE FUNCTION update_nft_owner()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE nft_settings
        SET owner_id = NEW.user_id,
            last_transferred_at = NEW.approved_at
        WHERE id = NEW.nft_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nft_owner
AFTER UPDATE ON nft_purchase_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_nft_owner(); 