-- 長時間実行中のメンテナンスタスクを検出
CREATE OR REPLACE VIEW v_long_running_maintenance AS
SELECT 
    task_name,
    started_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::integer as running_seconds
FROM maintenance_logs
WHERE status = 'running'
AND started_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes';

-- メンテナンス実行パターンの分析
CREATE MATERIALIZED VIEW mv_maintenance_stats AS
SELECT 
    task_name,
    COUNT(*) as execution_count,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
    MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_duration_seconds,
    COUNT(*) FILTER (WHERE status = 'error') as error_count
FROM maintenance_logs
WHERE completed_at IS NOT NULL
GROUP BY task_name; 