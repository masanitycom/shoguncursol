# test-connection.ps1
Write-Host "Testing database connection..."

# 環境変数の設定
$env:PGSSLMODE = "require"
$env:PGPASSWORD = "JjEVFVRNR9QY"

# 接続テスト（タイムアウトを延長）
pg_dump `
    --host=db.atvspduydtqimjnaliob.supabase.co `
    --port=5432 `
    --username=postgres.atvspduydtqimjnaliob `
    --dbname=postgres `
    --no-owner `
    --no-acl `
    --format=plain `
    --verbose `
    --connect-timeout=60 `
    --schema=public `
    --table=public.users `
    --data-only `
    --rows=1

Write-Host "Connection test completed with exit code: $LASTEXITCODE" 