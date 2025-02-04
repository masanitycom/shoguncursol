-- 重複承認の古い方を却下に変更
UPDATE nft_purchase_requests
SET status = 'rejected'
WHERE id IN (
    '44eb475a-f0b5-494b-ab2c-96d3c935ed56',  -- SHOGUN NFT 1000の古い方
    'a8bb90e3-0a00-47ad-830f-0b41cbce683c'   -- SHOGUN NFT 3000の古い方
);

-- owner_idの修正
UPDATE nft_settings
SET owner_id = 'fb5bfcf3-c45e-40fc-8815-4f0f4ea9ea33'
WHERE id = 'cbe68883-1d11-41e1-aa8b-458c37cc8a4f';  -- SHOGUN NFT 3000 