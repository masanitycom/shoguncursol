CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    user_id VARCHAR NOT NULL UNIQUE,
    name_kana VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR NOT NULL,
    wallet_address VARCHAR,
    wallet_type VARCHAR,
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    level VARCHAR DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id); 