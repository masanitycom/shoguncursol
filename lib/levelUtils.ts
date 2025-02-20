// レベル判定に関する共通ロジックをここに移動
export const LEVEL_NAMES_JP = {
    'none': '--',
    'ashigaru': '足軽',
    'busho': '武将',
    // ... 他のレベル
};

export const LEVEL_REQUIREMENTS = {
    NONE: {
        requiredNFT: 'NONE',
        totalInvestment: 0
    },
    ASHIGARU: {
        requiredNFT: 'SHOGUN NFT1000',
        totalInvestment: 1000,
        profitShare: 45
    },
    // ... 他のレベル
};

export const calculateUserLevel = (member: OrganizationMember): string => {
    // NFT要件チェック（1000以上のNFTを所持）
    const hasRequiredNFT = member.nft_purchase_requests?.some(nft =>
        Number(nft.nft_settings.price) >= 1000 && 
        nft.status === 'approved'
    );

    if (!hasRequiredNFT) {
        console.log('Level check:', {
            user: member.display_id,
            result: 'none',
            reason: 'No required NFT'
        });
        return 'NONE';
    }

    // 傘下の投資額チェック
    const teamInvestment = member.children.reduce((sum, child) => 
        sum + child.total_team_investment, 0);

    // 足軽の判定（傘下の投資額が1000以上）
    if (teamInvestment < 1000) {
        console.log('Level check:', {
            user: member.display_id,
            result: 'none',
            reason: 'Team investment < 1000',
            teamInvestment
        });
        return 'NONE';
    }

    // 上位レベルの判定
    if (member.max_line_investment >= 3000 && 
        member.other_lines_investment >= 1500) {
        return 'BUSHO';
    }
    
    return 'ASHIGARU';
};

export const getLevelLabel = (member: OrganizationMember): string => {
    // 既存のレベル判定ロジック
}; 