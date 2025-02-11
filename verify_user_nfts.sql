-- CSVインポートユーザーのNFT確認
SELECT 
    u.id,
    u.username,
    u.total_investment,
    COUNT(npr.id) as nft_count,
    STRING_AGG(ns.name, ', ') as nft_names
FROM users u
LEFT JOIN nft_purchase_requests npr ON u.id = npr.user_id
LEFT JOIN nft_settings ns ON npr.nft_id = ns.id
WHERE u.id IN (SELECT id FROM imported_users)
GROUP BY u.id, u.username, u.total_investment; 