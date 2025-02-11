-- 既存のバックアップテーブルを削除
DROP TABLE IF EXISTS binary_tree_backup;

-- 新しいバックアップを作成
CREATE TABLE binary_tree_backup AS SELECT * FROM binary_tree;

-- binary_treeテーブルを再作成
DROP TABLE binary_tree;
CREATE TABLE binary_tree (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    display_id VARCHAR NOT NULL,
    referrer_display_id VARCHAR,
    position VARCHAR CHECK (position IN ('left', 'right')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成
CREATE INDEX idx_binary_tree_user_id ON binary_tree(user_id);
CREATE INDEX idx_binary_tree_display_id ON binary_tree(display_id);
CREATE INDEX idx_binary_tree_referrer_display_id ON binary_tree(referrer_display_id);

-- 既存のデータを復元（必要な場合）
INSERT INTO binary_tree (
    user_id,
    display_id,
    referrer_display_id,
    position,
    created_at,
    updated_at
)
SELECT 
    user_id,
    display_id,
    referrer_display_id,
    position,
    created_at,
    updated_at
FROM binary_tree_backup; 