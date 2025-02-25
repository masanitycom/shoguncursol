import { OrganizationMember } from '@/types/organization'
import { LEVEL_NAMES_JP } from '@/lib/constants/levels'

interface LevelCheckData {
    user: string;
    nfts: any[];
    investment: number;
    maxLine: number;
    otherLines: number;
    totalTeam: number;
}

export const calculateUserLevel = (member: OrganizationMember): string => {
    // デバッグ用のログ出力を追加
    const checkData: LevelCheckData = {
        user: member.display_id,
        nfts: member.nft_purchase_requests || [],
        investment: member.investment_amount,
        maxLine: member.max_line_investment,
        otherLines: member.other_lines_investment,
        totalTeam: member.total_team_investment
    };
    console.log('レベル計算:', checkData);

    // 承認済みNFTの数を確認
    const approvedNfts = member.nft_purchase_requests?.filter(
        nft => nft.status === 'approved'
    ) || [];

    // NFT要件チェック（最低1つの承認済みNFTが必要）
    if (approvedNfts.length === 0) {
        console.log('レベル判定結果: NFT要件未達成', member.display_id);
        return 'NONE';
    }

    // 投資額要件チェック
    if (member.investment_amount < 1000) {
        console.log('レベル判定結果: 投資額要件未達成', member.display_id);
        return 'NONE';
    }

    // 武将以上の判定
    if (member.max_line_investment >= 3000 && member.other_lines_investment >= 1500) {
        if (member.max_line_investment >= 600000 && member.other_lines_investment >= 500000) return 'SHOGUN';
        if (member.max_line_investment >= 300000 && member.other_lines_investment >= 150000) return 'DAIMYO';
        if (member.max_line_investment >= 100000 && member.other_lines_investment >= 50000) return 'TAIRO';
        if (member.max_line_investment >= 50000 && member.other_lines_investment >= 25000) return 'ROJU';
        if (member.max_line_investment >= 10000 && member.other_lines_investment >= 5000) return 'BUGYO';
        if (member.max_line_investment >= 5000 && member.other_lines_investment >= 2500) return 'DAIKAN';
        return 'BUSHO';
    }

    // 足軽の判定
    if (member.max_line_investment >= 1000) {
        return 'ASHIGARU';
    }

    console.log('レベル判定結果: 要件未達成', member.display_id);
    return 'NONE';
};

export const getLevelLabel = (member: OrganizationMember): string => {
    const level = calculateUserLevel(member);
    return LEVEL_NAMES_JP[level.toLowerCase() as keyof typeof LEVEL_NAMES_JP] || 'なし';
}; 