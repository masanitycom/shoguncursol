-- nullのプロフィールデータを確認
SELECT 
    npr.id as request_id,
    npr.user_id,
    p.display_id,
    p.email,
    npr.status
FROM nft_purchase_requests npr
LEFT JOIN profiles p ON npr.user_id = p.user_id
WHERE npr.status = 'approved' 
AND (p.display_id IS NULL OR p.email IS NULL);

-- プロフィールが存在しない承認済みリクエストを確認
SELECT 
    npr.id,
    npr.user_id,
    npr.status,
    npr.created_at
FROM nft_purchase_requests npr
LEFT JOIN profiles p ON npr.user_id = p.user_id
WHERE npr.status = 'approved' 
AND p.id IS NULL; 