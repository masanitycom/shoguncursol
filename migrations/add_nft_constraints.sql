-- NFTタイプのname列にUNIQUE制約を追加
ALTER TABLE nft_types
ADD CONSTRAINT nft_types_name_key UNIQUE (name); 