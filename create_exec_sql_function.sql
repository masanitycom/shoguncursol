-- SQLを実行するための関数を作成
CREATE OR REPLACE FUNCTION exec_sql(sql_command text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_command;
END;
$$;

-- 関数に権限を付与
GRANT EXECUTE ON FUNCTION exec_sql TO postgres, authenticated, service_role; 