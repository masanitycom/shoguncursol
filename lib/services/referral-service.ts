import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'

interface Profile {
    id: string;
    display_id: string;
    name: string;
    email: string;
    investment: number;
    referrer: string | null;
    created_at: string;
    updated_at: string;
    phone: string | null;
    wallet_address: string | null;
    wallet_type: string | null;
    initial_investment_date: string | null;
    active: boolean;
}

interface ReferralTree {
    upline: Profile | null
    downline: Profile[]
}

interface LegacyUserData {
    id: string
    name: string
    investment: number
    referrer: string
    parentid: string
    position: 'left' | 'right'
    created_at: string
    phone: string | null
    email: string
    initial_investment_date: string
    name_kana?: string
}

interface SyncResult {
    success: number;
    failed: number;
    errors: string[];
}

interface ProcessedUserData {
    display_id: string;      // 必須
    name_kana: string;       // 空文字列を許容
    phone: string;           // 必須（電話番号）
    email: string | null;    // オプション
    investment: number;      // デフォルト0
    referrer_display_id: string | null;  // オプション
    created_at: string;      // 必須
}

// CSVの行データの型を定義
interface CSVRow {
    id?: string;
    name?: string;
    investment?: string;
    referrer?: string;
    parentid?: string;
    position?: string;
    created_at?: string;
    phone?: string;
    email?: string;
    initial_investment_date?: string;
    name_kana?: string;
}

export class ReferralService {
    // 紹介者の取得
    static async getReferrer(userId: string): Promise<Profile | null> {
        const { data: user } = await supabase
            .from('users')
            .select('referrer_id')
            .eq('id', userId)
            .single()

        if (!user?.referrer_id) return null

        const { data: referrerProfile } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                name,
                email,
                investment,
                referrer,
                created_at,
                updated_at,
                phone,
                wallet_address,
                wallet_type,
                initial_investment_date,
                active
            `)
            .eq('id', user.referrer_id)
            .single()

        // Profile型に変換して返す
        if (!referrerProfile) return null;

        return {
            id: referrerProfile.id,
            display_id: referrerProfile.display_id,
            name: referrerProfile.name,
            email: referrerProfile.email,
            investment: Number(referrerProfile.investment) || 0,
            referrer: referrerProfile.referrer,
            created_at: referrerProfile.created_at,
            updated_at: referrerProfile.updated_at,
            phone: referrerProfile.phone,
            wallet_address: referrerProfile.wallet_address,
            wallet_type: referrerProfile.wallet_type,
            initial_investment_date: referrerProfile.initial_investment_date,
            active: referrerProfile.active || false
        };
    }

    // 紹介した人（ダウンライン）の取得
    static async getReferrals(userId: string): Promise<Profile[]> {
        const { data: referrals } = await supabase
            .from('profiles')
            .select(`
                id,
                display_id,
                name,
                email,
                investment,
                referrer,
                created_at,
                updated_at,
                phone,
                wallet_address,
                wallet_type,
                initial_investment_date,
                active
            `)
            .eq('referrer', userId.toString());

        if (!referrals) return [];

        // Profile型に変換して返す
        return referrals.map(profile => ({
            id: profile.id,
            display_id: profile.display_id,
            name: profile.name,
            email: profile.email,
            investment: Number(profile.investment) || 0,
            referrer: profile.referrer,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            phone: profile.phone,
            wallet_address: profile.wallet_address,
            wallet_type: profile.wallet_type,
            initial_investment_date: profile.initial_investment_date,
            active: profile.active || false
        }));
    }

    // 紹介URLからの登録処理
    static async signUpWithReferrer(userData: Omit<Profile, 'id' | 'created_at'>, referrerId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                ...userData,
                referrer: referrerId
            })
        
        if (error) throw error
        return data
    }

    // 紹介ツリーの取得（上位と下位）
    static async getReferralTree(userId: string): Promise<ReferralTree> {
        const upline = await this.getReferrer(userId)
        const downline = await this.getReferrals(userId)

        return {
            upline,
            downline
        }
    }

    // UUIDを生成する関数をクラス内のstaticメソッドに変更
    static generateUUID(): string {
        return crypto.randomUUID() // より安全なUUID生成
    }

    // ユーザーデータの同期を安全に実行
    static async syncLegacyUsers(legacyUsers: LegacyUserData[]): Promise<SyncResult> {
        const results: SyncResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        try {
            for (const user of legacyUsers) {
                try {
                    // 新しいUUIDを生成
                    const newUserId = crypto.randomUUID();
                    
                    // データベースに挿入
                    const { error } = await supabase
                        .from('profiles')
                        .insert({
                            id: newUserId,           // 新しいUUID
                            display_id: user.id,     // CSVのIDはdisplay_idとして保存
                            name: user.name,
                            email: user.email,
                            investment: user.investment,
                            referrer: null,          // 一時的にnull、後で更新
                            created_at: user.created_at,
                            name_kana: user.name_kana,
                            active: true
                        });

                    if (error) throw error;
                    results.success++;

                    // デバッグ用
                    console.log(`Imported user: ${user.id} -> ${newUserId}`);

                } catch (error) {
                    console.error('Import error for user:', user.id, error);
                    results.failed++;
                    results.errors.push(error instanceof Error ? error.message : String(error));
                }
            }

            // 紹介者IDの更新（2回目のパス）
            for (const user of legacyUsers) {
                if (user.referrer) {
                    // 紹介者のdisplay_idから実際のUUIDを取得
                    const { data: referrer } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('display_id', user.referrer)
                        .single();

                    if (referrer) {
                        // 紹介者のUUIDで更新
                        await supabase
                            .from('profiles')
                            .update({ referrer: referrer.id })
                            .eq('display_id', user.id);
                    }
                }
            }

            return results;

        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    }

    // 同期ログの取得
    static async getSyncLogs(limit = 10) {
        const { data, error } = await supabase
            .from('sync_logs')
            .select('*')
            .order('executed_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data
    }

    // parseCSV関数の修正
    static async parseCSV(file: File, onProgress?: (progress: number) => void): Promise<LegacyUserData[]> {
        return new Promise((resolve, reject) => {
            Papa.parse<CSVRow>(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const users: LegacyUserData[] = results.data.map(row => ({
                        id: row.id?.toString() || '',
                        name: row.name?.toString() || '',
                        investment: row.investment ? parseInt(row.investment) : 0,
                        referrer: row.referrer?.toString() || '',
                        parentid: row.parentid?.toString() || '',
                        position: (row.position?.toString() || 'left') as 'left' | 'right',
                        created_at: row.created_at?.toString() || '',
                        phone: row.phone?.toString() || null,
                        email: row.email?.toString() || '',
                        initial_investment_date: row.initial_investment_date?.toString() || '',
                        name_kana: row.name_kana?.toString() || ''
                    }));
                    resolve(users);
                },
                error: (error) => {
                    reject(error);
                },
                step: (row, parser) => {
                    if (onProgress) {
                        onProgress(Math.round((row.meta.cursor / file.size) * 100));
                    }
                }
            });
        });
    }

    // 既存のコードに追加
    static async verifySync() {
        // profilesテーブルの確認
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select(`
                id,
                name,
                email,
                referrer,
                investment,
                nft_purchase_date,
                created_at,
                updated_at
            `)
            .order('created_at', { ascending: true })

        // auth.usersテーブルの確認（管理者権限が必要）
        const { data: authUsers, error: authError } = await supabase
            .from('auth.users')
            .select('*')

        return {
            success: !profileError && !authError,
            profiles: profiles || [],
            authUsers: authUsers || [],
            error: profileError?.message || authError?.message
        }
    }

    static async buildOrganizationTree(userId: string) {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    email,
                    display_id,
                    referrer
                `)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!users) return null;

            const buildTree = (rootId: string): OrganizationNode | null => {
                const node = users.find(u => u.id === rootId);
                if (!node) return null;

                return {
                    id: node.id,
                    name: node.name || null,
                    email: node.email,
                    display_id: node.display_id || null,
                    children: users
                        .filter(u => u.referrer === rootId)
                        .map(child => buildTree(child.id))
                        .filter((node): node is OrganizationNode => node !== null)
                };
            };

            return buildTree(userId);
        } catch (error) {
            console.error('組織図の取得エラー:', error);
            throw error;
        }
    }

    static async fetchOrganizationData() {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                name,
                email,
                display_id,
                referrer,
                created_at,
                updated_at,
                active,
                wallet_type,
                wallet_address,
                investment,
                nft_purchase_date,
                role,
                name_kana
            `)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }

    static async getAllUsers(): Promise<Profile[]> {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select(`
                    id,
                    name,
                    email,
                    display_id,
                    referrer,
                    created_at,
                    updated_at,
                    active,
                    wallet_type,
                    wallet_address,
                    investment,
                    initial_investment_date,
                    phone
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                throw error;
            }

            // データの整形と検証
            const formattedProfiles: Profile[] = (profiles || []).map(profile => ({
                id: profile.id,
                display_id: profile.display_id || '',
                name: profile.name || '',
                email: profile.email || '',
                investment: Number(profile.investment) || 0,
                referrer: profile.referrer,
                created_at: profile.created_at,
                updated_at: profile.updated_at || profile.created_at,
                phone: profile.phone || null,
                wallet_address: profile.wallet_address || null,
                wallet_type: profile.wallet_type || null,
                initial_investment_date: profile.initial_investment_date || null,
                active: profile.active || false
            }));

            return formattedProfiles;

        } catch (error) {
            console.error('Error in getAllUsers:', error);
            throw error;
        }
    }

    // CSVインポート処理の修正
    static async importUsersFromCSV(csvData: string): Promise<SyncResult> {
        try {
            const results = Papa.parse<LegacyUserData>(csvData, {
                header: true,
                skipEmptyLines: true
            });

            // データの検証と整形
            const processedUsers: ProcessedUserData[] = results.data
                .filter(user => {
                    // 必須項目の厳密なチェック
                    if (!user.id?.trim()) {
                        console.error(`Missing display_id: ${JSON.stringify(user)}`);
                        return false;
                    }
                    if (!user.phone?.trim()) {
                        console.error(`Missing phone for display_id ${user.id}: ${JSON.stringify(user)}`);
                        return false;
                    }
                    return true;
                })
                .map(user => ({
                    display_id: user.id.trim(),
                    name_kana: user.name_kana?.trim() || '',
                    phone: user.phone?.trim() || '',
                    email: user.email?.trim() || null,
                    investment: Number(user.investment) || 0,
                    referrer_display_id: user.referrer?.trim() || null,
                    created_at: new Date(user.created_at || new Date()).toISOString()
                }));

            // display_idの重複チェック
            const existingUsers = await supabase
                .from('profiles')
                .select('display_id')
                .in('display_id', processedUsers.map(u => u.display_id));

            if (existingUsers.data && existingUsers.data.length > 0) {
                const duplicates = existingUsers.data.map(u => u.display_id);
                throw new Error(`Duplicate display_ids found: ${duplicates.join(', ')}`);
            }

            // バッチ処理でインポート
            const batchSize = 50;
            const syncResults: SyncResult = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (let i = 0; i < processedUsers.length; i += batchSize) {
                const batch = processedUsers.slice(i, i + batchSize);
                const userInserts = batch.map(user => ({
                    id: crypto.randomUUID(),
                    display_id: user.display_id,  // display_idを明示的に設定
                    name: user.name_kana,         // カタカナ名を名前として使用
                    name_kana: user.name_kana,
                    phone: user.phone,
                    email: user.email,
                    investment: user.investment,
                    referrer: null,               // 後で更新
                    created_at: user.created_at,
                    active: true,
                    wallet_type: 'metamask'
                }));

                try {
                    const { error } = await supabase
                        .from('profiles')
                        .insert(userInserts);

                    if (error) {
                        throw new Error(`Batch insert failed: ${error.message}`);
                    }
                    syncResults.success += batch.length;
                } catch (error) {
                    syncResults.failed += batch.length;
                    syncResults.errors.push(`Batch ${i/batchSize + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            // 4. 紹介者IDの更新（成功したユーザーのみ）
            if (syncResults.success > 0) {
                const { data: allUsers } = await supabase
                    .from('profiles')
                    .select('id, display_id')
                    .in('display_id', processedUsers.map(u => u.display_id));

                const userMap = new Map(allUsers?.map(u => [u.display_id, u.id]));

                for (const user of processedUsers) {
                    if (user.referrer_display_id && userMap.has(user.referrer_display_id)) {
                        await supabase
                            .from('profiles')
                            .update({ referrer: userMap.get(user.referrer_display_id) })
                            .eq('display_id', user.display_id);
                    }
                }
            }

            return syncResults;

        } catch (error) {
            throw new Error(`CSV import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

interface OrganizationNode {
    id: string;
    name: string | null;
    email: string;
    display_id: string | null;
    children: OrganizationNode[];
} 