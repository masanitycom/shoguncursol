-- nft_purchase_requestsテーブルの構造確認
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'nft_purchase_requests';

-- user_nftsテーブルの構造確認
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'user_nfts'; 