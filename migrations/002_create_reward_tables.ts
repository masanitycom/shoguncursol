import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 日次利益テーブル
  pgm.createTable('daily_profits', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    date: { type: 'date', notNull: true },
    total_profit: { type: 'decimal(12,2)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('daily_profits', 'date');

  // NFT別日次利益テーブル
  pgm.createTable('nft_daily_profits', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_nft_id: { type: 'uuid', notNull: true, references: 'user_nfts' },
    date: { type: 'date', notNull: true },
    rate: { type: 'decimal(5,2)', notNull: true },
    profit_amount: { type: 'decimal(12,2)', notNull: true },
    is_airdropped: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('nft_daily_profits', ['user_nft_id', 'date']);

  // 報酬請求テーブル
  pgm.createTable('reward_requests', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    amount: { type: 'decimal(12,2)', notNull: true },
    status: { 
      type: 'text', 
      notNull: true, 
      default: 'pending',
      check: "status IN ('pending', 'approved', 'rejected')" 
    },
    wallet_address: { type: 'text', notNull: true },
    wallet_type: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    approved_at: { type: 'timestamptz' }
  });
  pgm.createIndex('reward_requests', ['user_id', 'status']);

  // ユーザー報酬テーブル
  pgm.createTable('user_rewards', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    total_amount: { type: 'decimal(12,2)', notNull: true, default: 0 },
    available_amount: { type: 'decimal(12,2)', notNull: true, default: 0 },
    last_claim_date: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('user_rewards', 'user_id');

  // 報酬請求履歴テーブル
  pgm.createTable('reward_claims', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users' },
    request_id: { type: 'uuid', notNull: true, references: 'reward_requests' },
    amount: { type: 'decimal(12,2)', notNull: true },
    status: { 
      type: 'text', 
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'completed', 'failed')" 
    },
    transaction_hash: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    completed_at: { type: 'timestamptz' }
  });
  pgm.createIndex('reward_claims', ['user_id', 'status']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('reward_claims');
  pgm.dropTable('user_rewards');
  pgm.dropTable('reward_requests');
  pgm.dropTable('nft_daily_profits');
  pgm.dropTable('daily_profits');
} 