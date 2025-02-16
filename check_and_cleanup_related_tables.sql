-- 1. 保持する本番ユーザーのIDを取得
WITH production_users AS (
    SELECT au.id as user_id, p.display_id
    FROM auth.users au
    JOIN profiles p ON au.id = p.user_id
    WHERE p.display_id IN (
        'hanamaru05',
        'USER3946',
        'USER0a18',
        'dondon002',
        'ADMIN001',
        'TEST001'
    )
)

-- 2. 各テーブルの確認
SELECT 'profiles' as table_name, COUNT(*) as count
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE p.user_id = pu.user_id
)
UNION ALL

SELECT 'user_nfts' as table_name, COUNT(*) as count
FROM user_nfts un
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE un.user_id = pu.user_id
)
UNION ALL

SELECT 'user_rewards' as table_name, COUNT(*) as count
FROM user_rewards ur
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE ur.user_id = pu.user_id
)
UNION ALL

SELECT 'reward_claims' as table_name, COUNT(*) as count
FROM reward_claims rc
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE rc.user_id = pu.user_id
)
UNION ALL

SELECT 'task_responses' as table_name, COUNT(*) as count
FROM task_responses tr
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE tr.user_id = pu.user_id
)
UNION ALL

SELECT 'airdrops' as table_name, COUNT(*) as count
FROM airdrops a
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE a.user_id = pu.user_id
)
UNION ALL

SELECT 'unilevel_structure' as table_name, COUNT(*) as count
FROM unilevel_structure us
WHERE NOT EXISTS (
    SELECT 1 FROM production_users pu WHERE us.user_id = pu.user_id
);

-- 3. 不要なデータの削除（確認後に実行）
DELETE FROM user_nfts
WHERE user_id NOT IN (SELECT user_id FROM production_users);

DELETE FROM user_rewards
WHERE user_id NOT IN (SELECT user_id FROM production_users);

DELETE FROM reward_claims
WHERE user_id NOT IN (SELECT user_id FROM production_users);

DELETE FROM task_responses
WHERE user_id NOT IN (SELECT user_id FROM production_users);

DELETE FROM airdrops
WHERE user_id NOT IN (SELECT user_id FROM production_users);

DELETE FROM unilevel_structure
WHERE user_id NOT IN (SELECT user_id FROM production_users);

-- 最後にprofilesを削除
DELETE FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM production_users); 