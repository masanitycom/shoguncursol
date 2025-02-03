CREATE TABLE users (
    -- 主キー（ユーザーの一意識別子）
    id UUID REFERENCES auth.users PRIMARY KEY,
    
    -- ユーザー名（重複不可）
    username TEXT UNIQUE NOT NULL,
    
    -- 紹介者ID（自己参照の外部キー）
    referrer_id UUID REFERENCES users(id),
    
    -- 現在のレベル（1以上の整数）
    current_level INTEGER CHECK (current_level >= 1) DEFAULT 1,
    
    -- 総投資額（12桁、小数点以下2桁）
    total_investment DECIMAL(12,2) DEFAULT 0.00,
    
    -- メタデータ（JSON形式で追加情報を保存）
    metadata JSONB DEFAULT '{}',
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 論理削除フラグ
    is_deleted BOOLEAN DEFAULT FALSE
);

-- インデックス（検索パフォーマンス向上のため）
CREATE INDEX idx_users_referrer_id ON users(referrer_id);
CREATE INDEX idx_users_username ON users(username);

-- 更新日時を自動更新するトリガー
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 