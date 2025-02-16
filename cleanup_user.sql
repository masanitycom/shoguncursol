-- プロフィールを削除
DELETE FROM profiles 
WHERE email = 'ariran004@shogun-trade.com';

-- auth.usersから削除（service_roleで実行）
DELETE FROM auth.users 
WHERE email = 'ariran004@shogun-trade.com'; 