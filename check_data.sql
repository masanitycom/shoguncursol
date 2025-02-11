-- binary_treeテーブルの現在のデータを確認
SELECT * FROM binary_tree;

-- usersテーブルとbinary_treeテーブルの結合確認
SELECT 
    u.email,
    u.id as user_id,
    bt.display_id,
    bt.referrer_display_id,
    bt.position
FROM users u
LEFT JOIN binary_tree bt ON u.id = bt.user_id
WHERE bt.user_id IS NULL; 