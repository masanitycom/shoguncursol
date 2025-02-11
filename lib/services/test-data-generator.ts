import { supabase } from '../supabase';
import { randomUUID } from 'crypto';  // UUIDを生成するために追加

// UUID型の定義
type uuid = string;

interface TestUser {
    id: string;
    user_id: string;
    name_kana: string;  // nameを削除し、name_kanaのみに
    email: string;
    phone: string;
    display_id: string;
    investment: number;
    referrer_id?: string;
    level?: string;
    nfts?: {
        nft_id: string;
        purchase_date: string;
        total_earnings: number;
        earnings_percent: number;
    }[];
}

interface WeeklyProfit {
    week_start: Date;
    total_profit: number;
    distribution_amount: number;  // 20%
}

// NFTの型定義を更新
interface NFTData {
    nft_id: string;
    nfts: {
        name: string;
        price?: number;  // valueをpriceに変更
        created_at?: Date;
    }[];
}

// 戻り値の型を定義
interface SaveResult {
    success: boolean;
    users?: TestUser[];
    error?: unknown;
}

// 組織構造を表現するための型定義を修正
interface UserData {
    id: string;
    user_id: string;
    referrer_id?: string;
    investment_amount: number;  // investment -> investment_amount
    display_id: string;
    created_at: string;
}

interface Organization {
    userId: string;
    investment: number;
    directReferrals: Organization[];
    totalInvestment: number;
    maxLineInvestment: number;
    depth: number;
}

interface OrgNode {
    userId: string;
    investment: number;
    directReferrals: OrgNode[];     // 複数の紹介者を持てる
    totalInvestment: number;        // 組織全体の投資総額
    maxLineInvestment: number;      // 最大系列の投資額
    depth: number;                  // 組織の深さ
    referrerDisplayId?: string;     // 紹介者のdisplay_id
    displayId: string;              // 自身のdisplay_id
    createdAt: Date;               // 作成日時
}

interface TreeNode {  // 削除
    id: uuid;
    user_id: string;
    display_id: string;
    referrer_display_id: string | null;
    created_at: Date;
    updated_at: Date;
}

export class TestDataGenerator {
    // レベルごとの分配率
    private static readonly PROFIT_SHARE_RATES = {
        ashigaru: 45,
        roju: 5,
        busho: 25,
        daimyo: 10,
        bugyo: 6,
        tairo: 4,
        daimyo_high: 3,
        shogun: 2
    };

    // NFTタイプの定義を完成
    private static readonly NFT_TYPES = [
        { 
            name: 'SHOGUN NFT300',
            price: 300,
            max_daily_rate: 0.5,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/300.png',
            description: 'SHOGUN NFT 300$'
        },
        { 
            name: 'SHOGUN NFT500',
            price: 500,
            max_daily_rate: 0.5,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/500.png',
            description: 'SHOGUN NFT 500$'
        },
        { 
            name: 'SHOGUN NFT1000',
            price: 1000,
            max_daily_rate: 1.0,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/1000.png',
            description: 'SHOGUN NFT 1000$'
        },
        { 
            name: 'SHOGUN NFT3000',
            price: 3000,
            max_daily_rate: 1.0,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/3000.png',
            description: 'SHOGUN NFT 3000$'
        },
        { 
            name: 'SHOGUN NFT5000',
            price: 5000,
            max_daily_rate: 1.0,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/5000.png',
            description: 'SHOGUN NFT 5000$'
        },
        { 
            name: 'SHOGUN NFT10000',
            price: 10000,
            max_daily_rate: 1.25,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/10000.png',
            description: 'SHOGUN NFT 10000$'
        },
        { 
            name: 'SHOGUN NFT30000',
            price: 30000,
            max_daily_rate: 1.5,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/30000.png',
            description: 'SHOGUN NFT 30000$'
        },
        { 
            name: 'SHOGUN NFT50000',
            price: 50000,
            max_daily_rate: 1.75,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/50000.png',
            description: 'SHOGUN NFT 50000$'
        },
        { 
            name: 'SHOGUN NFT100000',
            price: 100000,
            max_daily_rate: 2.0,
            is_special: false,
            max_earnings_percent: 300,
            image_url: '/nfts/100000.png',
            description: 'SHOGUN NFT 100000$'
        }
    ];

    private static readonly SPECIAL_NFT_TYPES = [
        { 
            name: 'LEGACY NFT100',
            price: 100,
            max_daily_rate: 0.3,
            is_special: true,
            max_earnings_percent: 300,
            image_url: '/nfts/special/100.png',
            description: '2024年10月からの移行特例NFT'
        },
        // ... 他の特例NFT
    ];

    // レベル定義を完成
    private static readonly LEVELS = [
        {
            id: 'shogun',
            name: '将軍',
            minInvestment: 50000,
            maxLineRequirement: 100000,
            otherLinesRequirement: 50000,
            profitShare: 2
        },
        {
            id: 'daimyo_high',
            name: '大名（上級）',
            minInvestment: 50000,
            maxLineRequirement: 80000,
            otherLinesRequirement: 40000,
            profitShare: 3
        },
        {
            id: 'tairo',
            minInvestment: 1000,
            maxLineRequirement: 100000,
            otherLinesRequirement: 50000,
            profitShare: 4
        },
        {
            id: 'bugyo',
            minInvestment: 1000,
            maxLineRequirement: 10000,
            otherLinesRequirement: 5000,
            profitShare: 6
        },
        {
            id: 'daimyo',
            minInvestment: 1000,
            maxLineRequirement: 5000,
            otherLinesRequirement: 2500,
            profitShare: 10
        },
        {
            id: 'busho',
            minInvestment: 1000,
            maxLineRequirement: 3000,
            otherLinesRequirement: 1500,
            profitShare: 25
        },
        {
            id: 'roju',
            name: '老中',
            minInvestment: 10000,
            maxLineRequirement: 10000,
            otherLinesRequirement: 5000,
            profitShare: 5
        },
        {
            id: 'ashigaru',
            name: '足軽',
            minInvestment: 1000,
            maxLineRequirement: 0,
            otherLinesRequirement: 0,
            profitShare: 45
        }
    ];

    // 投資額の分布を調整
    private static readonly INVESTMENT_OPTIONS = [
        { amount: 1000, weight: 30 },   // 30%
        { amount: 3000, weight: 25 },   // 25%
        { amount: 5000, weight: 20 },   // 20%
        { amount: 10000, weight: 15 },  // 15%
        { amount: 50000, weight: 10 }   // 10%
    ];

    // 重み付きランダム選択
    private static weightedRandom(): number {
        const total = this.INVESTMENT_OPTIONS.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * total;
        
        for (const option of this.INVESTMENT_OPTIONS) {
            random -= option.weight;
            if (random <= 0) return option.amount;
        }
        return this.INVESTMENT_OPTIONS[0].amount;
    }

    // NFTタイプをデータベースに保存
    private static async setupNFTTypes() {
        for (const nftType of this.NFT_TYPES) {
            const { data: existing } = await supabase
                .from('nft_types')
                .select('id')
                .eq('name', nftType.name)
                .single();

            if (!existing) {
                const { error } = await supabase
                    .from('nft_types')
                    .insert(nftType);

                if (error) throw error;
            }
        }
    }

    // ユーザーの保存処理を修正
    public static async createTestUsers(count: number): Promise<SaveResult> {
        try {
            await this.setupNFTTypes();
            const users: TestUser[] = [];
            const timestamp = new Date().getTime();
            const prefix = `TEST${timestamp}`;

            // まずルートユーザーを作成
            const rootUser = this.createUniqueUser(0, prefix);
            users.push(rootUser);

            // 残りのユーザーを作成
            for (let i = 1; i < count; i++) {
                const user = this.createUniqueUser(i, prefix);
                users.push(user);
            }

            // データベースの一意制約チェック
            const { data: existingUsers, error: checkError } = await supabase
                .from('users')
                .select('email, phone')
                .or(`email.in.(${users.map(u => u.email).join(',')}),phone.in.(${users.map(u => u.phone).join(',')})`);

            if (checkError) throw checkError;

            // 既存のメールアドレスと電話番号を除外
            const existingEmails = new Set(existingUsers?.map(u => u.email) || []);
            const existingPhones = new Set(existingUsers?.map(u => u.phone) || []);

            // ユーザーデータを保存（一意制約を考慮）
            for (const user of users) {
                // メールアドレスが既に存在する場合は新しいものを生成
                if (existingEmails.has(user.email)) {
                    user.email = `test${randomUUID()}@example.com`;
                }

                // 電話番号が既に存在する場合は新しいものを生成
                if (existingPhones.has(user.phone)) {
                    user.phone = `090${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
                }

                const { error: userError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        user_id: user.user_id,
                        name_kana: user.name_kana,
                        email: user.email,
                        phone: user.phone,
                        display_id: user.display_id,
                        investment_amount: user.investment,
                        active: true
                    });

                if (userError) {
                    console.error('ユーザー保存エラー:', userError);
                    continue; // エラーの場合は次のユーザーに進む
                }
            }

            // ユニレベル構造を構築
            await this.buildUnilevelStructure(users);

            return { success: true, users };

        } catch (error) {
            console.error('Error saving data:', error);
            return { success: false, error };
        }
    }

    static async generateAndSave(count: number = 10): Promise<SaveResult> {
        try {
            const result = await this.createTestUsers(count);
            if (!result.success) {
                throw new Error('テストユーザーの作成に失敗しました');
            }
            return result;
        } catch (error) {
            console.error('データ生成エラー:', error);
            return { success: false, error };
        }
    }

    // NFTの作成
    private static async createNFT(nftType: typeof this.NFT_TYPES[0]): Promise<string> {
        const { data: nft, error } = await supabase
            .from('nfts')
            .insert({
                name: nftType.name,
                price: nftType.price,
                description: nftType.description,
                image_url: nftType.image_url,
                nft_type: nftType.is_special ? 'special' : 'normal',  // チェック制約に合わせる
                daily_rate: nftType.max_daily_rate,
                status: 'active'
            })
            .select('id')
            .single();

        if (error) throw error;
        if (!nft) throw new Error('NFT creation failed');
        
        return nft.id;
    }

    // 組織構造を再構築
    private static async buildOrganizationStructure(users: TestUser[]): Promise<Organization | null> {
        try {
            const orgNodes = new Map<string, OrgNode>();
            
            // TestUserからOrgNodeを直接作成
            users.forEach(user => {
                orgNodes.set(user.display_id, {
                    userId: user.user_id,
                    displayId: user.display_id,
                    investment: user.investment,
                    directReferrals: [],
                    totalInvestment: user.investment,
                    maxLineInvestment: 0,
                    depth: 0,
                    createdAt: new Date()
                });
            });

            // 紹介関係を構築（MLM構造）
            users.forEach(user => {
                if (user.referrer_id) {
                    const referrer = users.find(u => u.id === user.referrer_id);
                    if (referrer) {
                        const referrerNode = orgNodes.get(referrer.display_id);
                        const currentNode = orgNodes.get(user.display_id);
                        if (referrerNode && currentNode) {
                            referrerNode.directReferrals.push(currentNode);
                            currentNode.referrerDisplayId = referrer.display_id;
                        }
                    }
                }
            });

            // 組織構造を計算
            const calculateOrganization = (node: OrgNode): Organization => {
                const org: Organization = {
                    userId: node.userId,
                    investment: node.investment,
                    directReferrals: [],
                    totalInvestment: node.investment,
                    maxLineInvestment: 0,
                    depth: 0
                };

                // 直接の紹介者の投資額を計算
                node.directReferrals.forEach(child => {
                    const childOrg = calculateOrganization(child);
                    org.directReferrals.push(childOrg);
                    org.totalInvestment += childOrg.totalInvestment;
                    
                    // 最大系列の投資額を更新
                    if (childOrg.totalInvestment > org.maxLineInvestment) {
                        org.maxLineInvestment = childOrg.totalInvestment;
                    }
                    
                    // 組織の深さを更新
                    org.depth = Math.max(org.depth, childOrg.depth + 1);
                });

                return org;
            };

            // ルートユーザーを見つけて計算を開始
            const rootUser = users.find(u => !u.referrer_id);
            if (!rootUser) {
                return null;
            }

            const rootNode = orgNodes.get(rootUser.display_id);
            if (!rootNode) {
                return null;
            }

            return calculateOrganization(rootNode);

        } catch (error) {
            console.error('組織構造の構築エラー:', error);
            return null;
        }
    }

    // レベル要件の定義を修正
    private static readonly LEVEL_REQUIREMENTS = {
        NONE: {
            requiredNFT: 'NONE',           // NFT要件なし
            totalInvestment: 0             // 組織全体の投資額
        },
        ASHIGARU: {
            requiredNFT: 'SHOGUN NFT1000', // SHOGUN NFT1000必須
            totalInvestment: 1000,         // 組織全体で1000ドル以上
            profitShare: 45                // 分配率45%
        },
        BUSHO: {
            requiredNFT: 'SHOGUN NFT1000',
            maxLineInvestment: 3000,       // 最大系列3000ドル以上
            otherLinesInvestment: 1500,    // 他系列全体で1500ドル以上
            profitShare: 25
        },
        DAIKANN: {
            maxLineInvestment: 5000,     // 最大系列5000ドル以上
            otherLinesInvestment: 2500,  // 他系列全体で2500ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 10              // 分配率10%
        },
        BUGYO: {
            maxLineInvestment: 10000,    // 最大系列10000ドル以上
            otherLinesInvestment: 5000,  // 他系列全体で5000ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 6               // 分配率6%
        },
        ROJU: {
            maxLineInvestment: 50000,    // 最大系列50000ドル以上
            otherLinesInvestment: 25000, // 他系列全体で25000ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 5               // 分配率5%
        },
        TAIRO: {
            maxLineInvestment: 100000,   // 最大系列100000ドル以上
            otherLinesInvestment: 50000, // 他系列全体で50000ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 4               // 分配率4%
        },
        DAIMYO: {
            maxLineInvestment: 300000,   // 最大系列300000ドル以上
            otherLinesInvestment: 150000,// 他系列全体で150000ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 3               // 分配率3%
        },
        SHOGUN: {
            maxLineInvestment: 600000,   // 最大系列600000ドル以上
            otherLinesInvestment: 500000,// 他系列全体で500000ドル以上
            requiredNFT: 'SHOGUN NFT1000',
            profitShare: 2               // 分配率2%
        }
    };

    // レベル判定の実装を修正
    private static determineLevel(org: Organization): string {
        // まずNFTの確認
        const hasRequiredNFT = this.checkUserNFT(org.userId);
        if (!hasRequiredNFT) {
            return 'none';  // SHOGUN NFT1000を持っていない場合は無条件でnone
        }

        // 将軍判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.SHOGUN.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.SHOGUN.otherLinesInvestment) {
            return 'shogun';
        }

        // 大名判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.DAIMYO.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.DAIMYO.otherLinesInvestment) {
            return 'daimyo';
        }

        // 大老判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.TAIRO.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.TAIRO.otherLinesInvestment) {
            return 'tairo';
        }

        // 老中判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.ROJU.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.ROJU.otherLinesInvestment) {
            return 'roju';
        }

        // 奉行判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.BUGYO.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.BUGYO.otherLinesInvestment) {
            return 'bugyo';
        }

        // 代官判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.DAIKANN.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.DAIKANN.otherLinesInvestment) {
            return 'daikann';
        }

        // 武将判定
        if (org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.BUSHO.maxLineInvestment &&
            org.totalInvestment - org.maxLineInvestment >= this.LEVEL_REQUIREMENTS.BUSHO.otherLinesInvestment) {
            return 'busho';
        }

        // 足軽判定（組織全体の投資額のみを確認）
        if (org.totalInvestment >= this.LEVEL_REQUIREMENTS.ASHIGARU.totalInvestment) {
            return 'ashigaru';
        }

        return 'none';
    }

    // レベル更新メソッドを追加
    private static async updateUserLevel(userId: string, level: string, org: Organization): Promise<void> {
        await supabase
            .from('users')
            .update({
                level,
                organization_total: org.totalInvestment,
                max_line_total: org.maxLineInvestment
            })
            .eq('id', userId);
    }

    // 紹介者チェーンの計算を完全に書き直し
    private static async calculateReferrerChain(userId: string): Promise<string[]> {
        try {
            const chain: string[] = [];
            let currentId = userId;
            const visited = new Set<string>();

            while (currentId && !visited.has(currentId)) {
                visited.add(currentId);
                const { data: user, error } = await supabase
                    .from('users')
                    .select('referrer_id, user_id')
                    .eq('id', currentId)
                    .single();

                if (error) {
                    console.error('紹介者チェーン計算エラー:', error);
                    break;
                }

                if (!user?.referrer_id) break;
                chain.push(user.referrer_id);
                currentId = user.referrer_id;
            }

            return chain;
        } catch (error) {
            console.error('紹介者チェーン計算中に予期せぬエラーが発生:', error);
            return [];
        }
    }

    // 組織全体の投資額計算も修正
    private static async calculateOrganizationTotal(userId: string): Promise<number> {
        try {
            // 組織全体の構造を一度に取得
            const { data: allUsers } = await supabase
                .from('users')
                .select('id, user_id, referrer_id, investment_amount')
                .order('created_at', { ascending: true });

            if (!allUsers) return 0;

            // 組織構造をツリーで管理
            type OrgNode = {
                id: string;
                investment: number;
                children: OrgNode[];
                depth: number;
            };

            // ツリー構造を構築
            const buildTree = (nodeId: string, depth: number = 0): OrgNode | null => {
                const user = allUsers.find(u => u.id === nodeId);
                if (!user) return null;

                const node: OrgNode = {
                    id: user.id,
                    investment: user.investment_amount || 0,
                    children: [],
                    depth
                };

                // 直接の紹介者を追加
                allUsers
                    .filter(u => u.referrer_id === user.id)
                    .forEach(child => {
                        const childNode = buildTree(child.id, depth + 1);
                        if (childNode) node.children.push(childNode);
                    });

                return node;
            };

            // 組織の合計を計算
            const calculateTotal = (node: OrgNode): number => {
                const childrenTotal = node.children.reduce((sum, child) => 
                    sum + calculateTotal(child), 0);
                return node.investment + childrenTotal;
            };

            const tree = buildTree(userId);
            if (!tree) return 0;

            const total = calculateTotal(tree);
            console.log(`組織合計 (${userId}): ${total}`);
            return total;

        } catch (error) {
            console.error('組織計算エラー:', error);
            return 0;
        }
    }

    // 最大系列の投資額計算にデバッグ情報を追加
    private static async calculateMaxLineTotal(userId: string): Promise<number> {
        const { data: directReferrals } = await supabase
            .from('users')
            .select('id, investment_amount, user_id')  // user_idも取得
            .eq('referrer_id', userId);

        console.log(`直接の紹介者 (${userId}):`, 
            directReferrals?.map(r => ({
                id: r.id,
                user_id: r.user_id,
                investment: r.investment_amount
            }))
        );

        if (!directReferrals || directReferrals.length === 0) return 0;

        const lineTotals = await Promise.all(
            directReferrals.map(async (referral) => {
                const subTotal = await this.calculateLineTotal(referral.id);
                const total = (referral.investment_amount || 0) + subTotal;
                console.log(`系列計算 (${referral.user_id}):
                    投資額: ${referral.investment_amount}
                    配下合計: ${subTotal}
                    系列合計: ${total}
                `);
                return total;
            })
        );

        const maxTotal = Math.max(...lineTotals);
        console.log(`最大系列投資額: ${maxTotal}`);
        return maxTotal;
    }

    // 系列の合計額計算により詳細なデバッグ情報を追加
    private static async calculateLineTotal(userId: string): Promise<number> {
        try {
            const { data: user } = await supabase
                .from('users')
                .select('investment_amount, user_id')
                .eq('id', userId)
                .single();

            if (!user) return 0;

            const { data: directReferrals } = await supabase
                .from('users')
                .select('id, investment_amount, user_id')
                .eq('referrer_id', userId);

            const userAmount = user.investment_amount || 0;

            if (!directReferrals || directReferrals.length === 0) {
                return userAmount;
            }

            // 各系列の合計を計算
            const lineTotals = await Promise.all(
                directReferrals.map(async referral => {
                    const subTotal = await this.calculateLineTotal(referral.id);
                    return (referral.investment_amount || 0) + subTotal;
                })
            );

            // 最大の系列を返す
            const maxLineTotal = Math.max(...lineTotals);
            return userAmount + maxLineTotal;

        } catch (error) {
            console.error('系列計算エラー:', error);
            return 0;
        }
    }

    // NFTチェックメソッドを修正
    private static async checkUserNFT(userId: string): Promise<boolean> {
        try {
            // テストデータ生成時は常にNFT要件を満たしているとみなす
            return true;

        } catch (error) {
            console.error('NFTチェックエラー:', error);
            // エラーの場合もデフォルトでtrueを返す（テスト用）
            return true;
        }
    }

    // calculateInvestments メソッドを修正（クラス内のメソッドとして定義）
    private static calculateInvestments(node: OrgNode): void {
        node.totalInvestment = node.investment;
        node.maxLineInvestment = 0;
        
        for (const referral of node.directReferrals) {
            this.calculateInvestments(referral);
            node.totalInvestment += referral.totalInvestment;
            node.maxLineInvestment = Math.max(
                node.maxLineInvestment,
                referral.totalInvestment
            );
        }
    }

    private static async generateNFTData(userId: string): Promise<NFTData> {
        const nft_id = randomUUID();
        const currentDate = new Date();
        
        return {
            nft_id,
            nfts: [
                {
                    name: `NFT #${Math.floor(Math.random() * 1000)}`,
                    price: Math.floor(Math.random() * 10000),
                    created_at: currentDate
                }
            ]
        };
    }

    // NFTデータをデータベースに保存する関数
    private static async saveNFTData(nftData: NFTData): Promise<void> {
        try {
            const { error } = await supabase
                .from('nfts')
                .insert([nftData]);

            if (error) {
                console.error('NFTデータの保存エラー:', error);
                throw error;
            }
        } catch (error) {
            console.error('NFTデータの保存中に予期せぬエラーが発生:', error);
            throw error;
        }
    }

    // バイナリツリー関連のコードを削除
    private static async cleanupOldStructures(): Promise<void> {
        try {
            // binary_treeテーブルの削除
            const { error: error1 } = await supabase
                .from('binary_tree')
                .delete()
                .neq('id', ''); // 全レコードを削除

            if (error1) {
                console.error('binary_tree削除エラー:', error1);
            }

            // organization_structureテーブルの削除
            const { error: error2 } = await supabase
                .from('organization_structure')
                .delete()
                .neq('id', ''); // 全レコードを削除

            if (error2) {
                console.error('organization_structure削除エラー:', error2);
            }
        } catch (error) {
            console.error('構造クリーンアップエラー:', error);
        }
    }

    // ユニレベル構造の構築
    private static async buildUnilevelStructure(users: TestUser[]): Promise<void> {
        try {
            // ユーザーの初期データを構築
            const userUpdates = users.slice(1).map(user => {
                const hierarchyLevel = Math.floor(Math.log2(users.indexOf(user) + 1));
                const possibleReferrers = users.filter(u => 
                    users.indexOf(u) < users.indexOf(user) && 
                    Math.floor(Math.log2(users.indexOf(u) + 1)) === hierarchyLevel - 1
                );
                const referrer = possibleReferrers.length > 0 
                    ? possibleReferrers[Math.floor(Math.random() * possibleReferrers.length)]
                    : users[0];

                return {
                    id: user.id,
                    user_id: user.id,
                    name_kana: user.name_kana,
                    email: user.email,
                    phone: user.phone,
                    display_id: user.display_id,
                    referrer_id: referrer.id,
                    investment_amount: user.investment,
                    level: this.calculateInitialLevel(user.investment),
                    active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            });

            // ユーザーデータを更新
            for (const update of userUpdates) {
                const { error } = await supabase
                    .from('users')
                    .upsert(update);

                if (error) {
                    console.error('ユーザー更新エラー:', error);
                    throw error;
                }
            }

            // ユニレベル構造データを構築
            const structureData = userUpdates.map(update => ({
                user_id: update.id,
                referrer_id: update.referrer_id,
                total_investment: update.investment_amount
            }));

            // ユニレベル構造を保存
            for (const data of structureData) {
                const { error } = await supabase
                    .from('unilevel_structure')
                    .insert(data);

                if (error) {
                    console.error('ユニレベル構造構築エラー:', error);
                    throw error;
                }
            }

            // レベル分布を更新（新しいメソッドを使用）
            await this.updateLevelDistribution(users);

        } catch (error) {
            console.error('ユニレベル構造構築中にエラーが発生:', error);
            throw error;
        }
    }

    private static calculateInitialLevel(investment: number): string {
        if (investment >= 50000) return 'roju';
        if (investment >= 30000) return 'bugyo';
        if (investment >= 10000) return 'busho';
        if (investment >= 5000) return 'tairo';
        if (investment >= 3000) return 'ashigaru';
        return 'none';
    }

    // 最適な紹介者を選択
    private static selectOptimalReferrer(index: number, users: TestUser[]): number {
        const maxDirectReferrals = 3; // 1人あたりの最大紹介数
        const referrerCounts = new Map<string, number>();

        // 各ユーザーの紹介数をカウント
        users.forEach(user => {
            if (user.referrer_id) {
                const count = referrerCounts.get(user.referrer_id) || 0;
                referrerCounts.set(user.referrer_id, count + 1);
            }
        });

        // 条件を満たす紹介者を探す
        const possibleReferrers = users
            .slice(0, index)
            .filter(user => (referrerCounts.get(user.id) || 0) < maxDirectReferrals);

        if (possibleReferrers.length === 0) {
            return 0; // ルートユーザーを返す
        }

        // ランダムに選択（より均等な分布のため）
        return users.indexOf(possibleReferrers[Math.floor(Math.random() * possibleReferrers.length)]);
    }

    // ユニークなユーザーを作成するヘルパーメソッド
    private static createUniqueUser(index: number, prefix: string): TestUser {
        const paddedIndex = String(index).padStart(4, '0');
        const uniqueSuffix = randomUUID().substring(0, 8);
        const userId = randomUUID();  // UUIDを生成
        
        return {
            id: userId,  // UUIDを設定
            user_id: userId,  // user_idもUUIDを使用
            name_kana: this.generateRandomName(index),
            email: `test${prefix}${paddedIndex}${uniqueSuffix}@example.com`,
            phone: `090${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            display_id: `${prefix}${paddedIndex}`,
            investment: this.generateRealisticInvestment()
        };
    }

    // メイン処理部分を修正
    public static async saveTestData(count: number): Promise<SaveResult> {
        try {
            // 古い構造を削除
            await this.cleanupOldStructures();

            const users = [];
            const prefix = `TEST${Date.now()}`;

            // ユーザーデータを生成
            for (let i = 0; i < count; i++) {
                users.push(this.createUniqueUser(i, prefix));
            }

            // ユーザーを保存
            for (const user of users) {
                const { error } = await supabase
                    .from('users')
                    .insert(user);
                if (error) throw error;
            }

            // ユニレベル構造のみを構築
            await this.buildUnilevelStructure(users);

            return { success: true, users };
        } catch (error) {
            return { success: false, error };
        }
    }

    // 名前生成のための定数を追加
    private static readonly NAME_PATTERNS = {
        FAMILY_NAMES: [
            'ヤマダ',
            'タナカ',
            'スズキ',
            'サトウ',
            'ワタナベ'
        ] as const,
        
        GIVEN_NAMES: [
            'タロウ',
            'ハナコ',
            'ジロウ',
            'ケイスケ',
            'ユウコ'
        ] as const
    } as const;

    private static generateRandomName(index: number): string {
        const familyName = this.NAME_PATTERNS.FAMILY_NAMES[
            index % this.NAME_PATTERNS.FAMILY_NAMES.length
        ];
        
        const givenName = this.NAME_PATTERNS.GIVEN_NAMES[
            Math.floor(index / this.NAME_PATTERNS.FAMILY_NAMES.length) % this.NAME_PATTERNS.GIVEN_NAMES.length
        ];
        
        const paddedIndex = String(index).padStart(3, '0');
        return `${familyName}${givenName}${paddedIndex}`;
    }

    // より現実的な投資額分布を生成
    private static generateRealisticInvestment(): number {
        const rand = Math.random();
        if (rand < 0.3) return 1000;     // 30%の確率で1000
        if (rand < 0.5) return 3000;     // 20%の確率で3000
        if (rand < 0.7) return 5000;     // 20%の確率で5000
        if (rand < 0.85) return 10000;   // 15%の確率で10000
        if (rand < 0.95) return 30000;   // 10%の確率で30000
        return 50000;                    // 5%の確率で50000
    }

    // 型ガードを追加
    private static isTestUser(user: any): user is TestUser {
        return 'investment' in user;
    }

    // レベル分布の集計を完全に書き直し
    private static async updateLevelDistribution(users: TestUser[]): Promise<void> {
        try {
            // レベル分布を集計
            const levelStats = new Map<string, { count: number; total_investment: number }>();
            
            // 初期化
            const levels = ['none', 'ashigaru', 'busho', 'bugyo', 'tairo', 'roju'];
            levels.forEach(level => {
                levelStats.set(level, { count: 0, total_investment: 0 });
            });

            // デバッグ用
            console.log('投資額分布:');
            users.forEach(user => {
                console.log(`${user.display_id}: ${user.investment}円`);
            });

            // ユーザーごとにレベルを計算して集計
            for (const user of users) {
                const level = this.calculateInitialLevel(user.investment);
                console.log(`${user.display_id}: 投資額=${user.investment}円, レベル=${level}`);
                
                const stats = levelStats.get(level);
                if (stats) {
                    stats.count++;
                    stats.total_investment += user.investment;
                }
            }

            // 集計結果をデバッグ出力
            console.log('レベル分布集計結果:');
            levelStats.forEach((stats, level) => {
                console.log(`${level}: ${stats.count}人, 総投資額=${stats.total_investment}円`);
            });

            // データベースを更新
            const entries = Array.from(levelStats.entries());
            for (const [level, stats] of entries) {
                const { error } = await supabase
                    .from('level_distribution')
                    .update({
                        count: stats.count,
                        total_investment: stats.total_investment,
                        updated_at: new Date().toISOString()
                    })
                    .eq('level', level);

                if (error) {
                    throw new Error(`レベル ${level} の更新に失敗: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('レベル分布更新エラー:', error);
            throw error;
        }
    }
} 