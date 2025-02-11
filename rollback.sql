-- 問題が発生した場合は以下のSQLでロールバック
DELETE FROM binary_tree;
INSERT INTO binary_tree SELECT * FROM binary_tree_backup; 