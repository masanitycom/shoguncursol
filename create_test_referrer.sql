-- まずauthテーブルにユーザーを作成
INSERT INTO auth.users (id, email)
VALUES 
    ('test001-uuid', 'test001@example.com');

-- profilesテーブルにデータを作成
INSERT INTO profiles (
    id,
    user_id,
    display_id,
    name,
    email,
    created_at,
    updated_at
)
VALUES (
    'test001-profile-uuid',
    'test001-uuid',
    'TEST001',
    'テストユーザー1',
    'test001@example.com',
    NOW(),
    NOW()
);

-- 作成されたことを確認
SELECT * FROM profiles WHERE display_id = 'TEST001'; 