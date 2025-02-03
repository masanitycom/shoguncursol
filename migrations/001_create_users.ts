import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('users', {
        id: { type: 'uuid', primaryKey: true },
        user_id: { type: 'varchar', notNull: true, unique: true },
        name_kana: { type: 'varchar', notNull: true },
        email: { type: 'varchar', notNull: true },
        phone: { type: 'varchar', notNull: true },
        wallet_address: { type: 'varchar' },
        wallet_type: { type: 'varchar' },
        referrer_id: { 
            type: 'uuid', 
            references: 'users',
            onDelete: 'SET NULL' 
        },
        level: { 
            type: 'varchar', 
            default: 'none' 
        },
        created_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        updated_at: {
            type: 'timestamp with time zone',
            notNull: true,
            default: pgm.func('current_timestamp')
        }
    });

    // インデックスの作成
    pgm.createIndex('users', 'user_id');
    pgm.createIndex('users', 'email');
    pgm.createIndex('users', 'referrer_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('users');
} 