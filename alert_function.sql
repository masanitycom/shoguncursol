CREATE OR REPLACE FUNCTION notify_maintenance_alert()
RETURNS trigger AS $$
BEGIN
    -- エラー発生時のアラート
    IF NEW.status = 'error' THEN
        -- ここにアラート通知のロジックを実装
        -- 例: Slackやメール通知
        PERFORM pg_notify(
            'maintenance_alert',
            json_build_object(
                'task', NEW.task_name,
                'error', NEW.error_message,
                'time', NEW.completed_at
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintenance_alert_trigger
AFTER UPDATE ON maintenance_logs
FOR EACH ROW
WHEN (NEW.status = 'error')
EXECUTE FUNCTION notify_maintenance_alert(); 