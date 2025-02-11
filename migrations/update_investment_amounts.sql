-- profilesテーブルの投資額を更新
UPDATE profiles p
SET investment_amount = COALESCE(
    (SELECT SUM(ns.price)
     FROM nft_purchase_requests npr
     JOIN nft_settings ns ON npr.nft_id = ns.id
     WHERE npr.user_id = p.user_id
     AND npr.status = 'approved'
    ), 0
);

-- チーム投資額の更新（紹介関係を基に計算）
WITH RECURSIVE team_hierarchy AS (
    -- 直接の紹介者
    SELECT 
        p.user_id,
        p.investment_amount,
        1 as level
    FROM profiles p
    
    UNION ALL
    
    -- 紹介者の紹介者（再帰的に）
    SELECT 
        p.user_id,
        p.investment_amount,
        th.level + 1
    FROM profiles p
    JOIN team_hierarchy th ON p.referrer_id = th.user_id
    WHERE th.level < 10  -- 無限ループを防ぐ
)
UPDATE profiles p
SET total_team_investment = (
    SELECT SUM(investment_amount)
    FROM team_hierarchy
    WHERE user_id != p.user_id  -- 自分自身を除く
);

-- max_line_investmentとother_lines_investmentの更新は
-- 別途実装が必要です 