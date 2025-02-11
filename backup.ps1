# backup.ps1
$date = Get-Date -Format "yyyyMMdd"
$outputFile = "backups/backup_$date.sql"

# バックアップディレクトリの作成
New-Item -ItemType Directory -Force -Path "backups"

Write-Host "Starting backup to $outputFile..."

# 環境変数の設定
$env:DATABASE_URL = "postgres://postgres.atvspduydtqimjnaliob:JjEVFVRNR9QY@db.atvspduydtqimjnaliob.supabase.co:5432/postgres?sslmode=require"

# pg_dumpの実行
pg_dump $env:DATABASE_URL `
    --verbose `
    --no-owner `
    --no-acl `
    --format=plain `
    --file=$outputFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully to $outputFile"
} else {
    Write-Host "Backup failed with exit code $LASTEXITCODE"
} 