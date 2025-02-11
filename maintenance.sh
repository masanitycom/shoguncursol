#!/bin/bash

# オプション解析
FULL_MAINTENANCE=0
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            FULL_MAINTENANCE=1
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# 環境変数の読み込み
source .env

# データベース接続情報
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}
DB_HOST=${POSTGRES_HOST}
DB_PORT=${POSTGRES_PORT}
DB_PASSWORD=${POSTGRES_PASSWORD}

# ログファイルの設定
LOG_DIR="/var/log/db-maintenance"
LOG_FILE="${LOG_DIR}/maintenance_$(date +%Y%m%d_%H%M%S).log"

# ログディレクトリの作成
mkdir -p ${LOG_DIR}

# メンテナンス実行
echo "Starting maintenance tasks at $(date)" >> ${LOG_FILE}

# VACUUMの実行（トランザクションの外で実行）
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -U ${DB_USER} << EOF >> ${LOG_FILE} 2>&1
\timing
VACUUM (ANALYZE, VERBOSE) nft_purchase_requests;
VACUUM (ANALYZE, VERBOSE) daily_profits;
VACUUM (ANALYZE, VERBOSE) profiles;
EOF

# その他のメンテナンスタスクの実行
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -U ${DB_USER} -f maintenance.sql >> ${LOG_FILE} 2>&1

# フルメンテナンス時の追加タスク
if [ $FULL_MAINTENANCE -eq 1 ]; then
    echo "Running full maintenance..." >> ${LOG_FILE}
    PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -U ${DB_USER} << EOF >> ${LOG_FILE} 2>&1
    VACUUM FULL ANALYZE users;
    VACUUM FULL ANALYZE profiles;
    REINDEX TABLE users;
    REINDEX TABLE profiles;
EOF
fi

# 実行結果の確認
if [ $? -eq 0 ]; then
    echo "Maintenance completed successfully at $(date)" >> ${LOG_FILE}
    exit 0
else
    echo "Maintenance failed at $(date)" >> ${LOG_FILE}
    exit 1
fi 