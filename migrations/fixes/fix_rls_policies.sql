-- nft_purchase_requestsテーブルのポリシーを確認・修正
DROP POLICY IF EXISTS "Users can view their own purchase requests" ON nft_purchase_requests;
CREATE POLICY "Users can view their own purchase requests" 
ON nft_purchase_requests
FOR SELECT 
TO authenticated
USING (
    auth.uid() = user_id
);

-- nft_settingsテーブルのポリシーを確認・修正
DROP POLICY IF EXISTS "Anyone can view NFT settings" ON nft_settings;
CREATE POLICY "Anyone can view NFT settings" 
ON nft_settings
FOR SELECT 
TO authenticated
USING (true);

-- get_user_nfts関数のセキュリティを設定
ALTER FUNCTION get_user_nfts(UUID) SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION get_user_nfts(UUID) FROM public;
GRANT EXECUTE ON FUNCTION get_user_nfts(UUID) TO authenticated;

-- テーブルのRLSを有効化
ALTER TABLE nft_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_settings ENABLE ROW LEVEL SECURITY;

-- デバッグ用のクエリ
SELECT 
    has_table_privilege('authenticated', 'nft_purchase_requests', 'SELECT') as can_select_requests,
    has_table_privilege('authenticated', 'nft_settings', 'SELECT') as can_select_settings,
    has_function_privilege('authenticated', 'get_user_nfts(UUID)', 'EXECUTE') as can_execute_function; 