import { OrganizationMember } from '@/types/organization'
import { LEVEL_NAMES_JP } from '@/lib/constants/levels'

// レベル要件の定義
export const LEVEL_REQUIREMENTS = {
    NONE: {
        nftRequired: false,
        maxLine: 0,
        otherLines: 0,
        shareRate: 0
    },
    ASHIGARU: {
        nftRequired: false,
        maxLine: 1000,
        otherLines: 500,
        shareRate: 45
    },
    BUSHO: {
        nftRequired: false,
        maxLine: 3000,
        otherLines: 1500,
        shareRate: 25
    },
    DAIKANN: {
        nftRequired: false,
        maxLine: 5000,
        otherLines: 2500,
        shareRate: 10
    },
    BUGYO: {
        nftRequired: false,
        maxLine: 10000,
        otherLines: 5000,
        shareRate: 6
    },
    ROJU: {
        nftRequired: false,
        maxLine: 50000,
        otherLines: 25000,
        shareRate: 5
    },
    TAIRO: {
        nftRequired: false,
        maxLine: 100000,
        otherLines: 50000,
        shareRate: 4
    },
    DAIMYO: {
        nftRequired: false,
        maxLine: 300000,
        otherLines: 150000,
        shareRate: 3
    },
    SHOGUN: {
        nftRequired: false,
        maxLine: 600000,
        otherLines: 500000,
        shareRate: 2
    }
};

export function calculateLevel(member: OrganizationMember): string {
    console.log('レベル判定開始:', {
        user: member.display_id,
        nfts: member.nft_purchase_requests,
        maxLine: member.max_line_investment,
        otherLines: member.other_lines_investment
    });

    // NFTデータの詳細をログ出力
    if (member.nft_purchase_requests && member.nft_purchase_requests.length > 0) {
        member.nft_purchase_requests.forEach(nft => {
            console.log('NFT詳細:', {
                id: nft.id,
                status: nft.status,
                nft_master: nft.nft_master,
                price: nft.nft_master?.price,
                user: member.display_id
            });
        });
    }

    // NFT要件チェック
    const approvedNft = member.nft_purchase_requests?.find(nft => {
        const isApproved = nft.status === 'approved';
        const price = Number(nft.nft_master?.price);
        const meetsRequirement = price >= 1000;

        console.log('NFT判定:', {
            user: member.display_id,
            isApproved,
            price,
            meetsRequirement
        });

        return isApproved && meetsRequirement;
    });

    if (!approvedNft) {
        console.log('NFT要件未達成:', member.display_id);
        return 'NONE';
    }

    console.log('NFT要件達成:', {
        user: member.display_id,
        nft: approvedNft
    });

    // 投資額要件チェック
    if (member.max_line_investment >= 3000 && member.other_lines_investment >= 1500) {
        console.log('武将要件達成:', {
            user: member.display_id,
            maxLine: member.max_line_investment,
            otherLines: member.other_lines_investment
        });
        return 'BUSHO';
    }

    return 'NONE';
}

export const getLevelLabel = (member: OrganizationMember): string => {
    const level = calculateLevel(member)
    return LEVEL_NAMES_JP[level] || 'なし'
}

// 報酬率の取得
export const getShareRate = (member: OrganizationMember): number => {
    const levelLabel = getLevelLabel(member);
    for (const [key, value] of Object.entries(LEVEL_REQUIREMENTS)) {
        if (LEVEL_NAMES_JP[key.toLowerCase() as keyof typeof LEVEL_NAMES_JP] === levelLabel) {
            return value.shareRate;
        }
    }
    return 0;
}; 