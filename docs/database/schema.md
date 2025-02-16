# データベース構造

## 主要テーブル

### NFT関連
- nfts
- nft_master
- nft_settings
- nft_operations
- nft_purchase_requests
- nft_daily_profits
- user_nfts

### ユーザー関連
- users
- profiles
- user_levels
- user_rewards
- user_investments
- user_organization_stats

### 報酬関連
- rewards
- reward_claims
- reward_requests
- level_rewards
- profit_distributions

### その他
- tasks
- task_responses
- system_settings
- maintenance_logs

## 重要なビュー
- v_user_organization_status
- v_user_nft_status
- v_level_progress
- v_organization_qualification
- purchase_requests_view

## 外部キー制約
（主要な制約のみ記載）
- nft_purchase_requests.user_id -> profiles.user_id
- profiles.user_id -> users.id
- user_nfts.nft_id -> nfts.id
- nft_operations.nft_id -> nft_master.id
など

## バックアップテーブル
- profiles_backup
- users_backup
- nft_purchase_requests_backup_20240203
など 