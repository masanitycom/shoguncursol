-- 最近のメンテナンス実行状況を確認
SELECT 
    task_name,
    started_at,
    completed_at,
    status,
    CASE 
        WHEN status = 'completed' THEN 
            EXTRACT(EPOCH FROM (completed_at - started_at))::integer || ' seconds'
        ELSE NULL 
    END as duration,
    error_message
FROM maintenance_logs
WHERE started_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY started_at DESC;

-- エラーが発生したタスクの詳細確認
SELECT 
    task_name,
    started_at,
    completed_at,
    error_message,
    details->>'error_detail' as error_detail,
    details->>'error_hint' as error_hint
FROM maintenance_logs
WHERE status = 'error'
AND started_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY started_at DESC; 