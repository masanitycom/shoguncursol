-- メンテナンス実行用SQL
DO $$
DECLARE
    maintenance_id uuid;
BEGIN
    -- メンテナンス開始ログ
    INSERT INTO maintenance_logs (task_name, status)
    VALUES ('full_maintenance', 'running')
    RETURNING id INTO maintenance_id;

    -- 統計情報の更新
    ANALYZE verbose users;
    ANALYZE verbose nft_purchase_requests;
    ANALYZE verbose daily_profits;
    ANALYZE verbose profiles;

    -- マテリアライズドビューの更新
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_nft_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_nft_profit_stats;

    -- メンテナンス完了ログ
    UPDATE maintenance_logs 
    SET status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        details = jsonb_build_object(
            'analyzed_tables', ARRAY['users', 'nft_purchase_requests', 'daily_profits', 'profiles'],
            'refreshed_views', ARRAY['mv_user_nft_stats', 'mv_nft_profit_stats']
        )
    WHERE id = maintenance_id;

EXCEPTION WHEN OTHERS THEN
    -- エラー発生時のログ
    UPDATE maintenance_logs 
    SET status = 'error',
        completed_at = CURRENT_TIMESTAMP,
        error_message = SQLERRM,
        details = jsonb_build_object(
            'error_detail', SQLSTATE,
            'error_hint', sqlerrm
        )
    WHERE id = maintenance_id;
    RAISE;
END $$; 