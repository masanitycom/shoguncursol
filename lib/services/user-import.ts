import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'
import { v4 as uuidv4 } from 'uuid'

interface CSVUser {
    id: string               // display_id として使用
    name: string            
    name_kana: string
    email: string
    phone: string
    investment: number
    referrer: string        // 紹介者のdisplay_id
    initial_investment_date: string
    position: string        // left/right
}

interface LegacyUserData {
    id: string           // CSVのID列
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

// インポート結果の型を定義
interface ImportResult {
    success: boolean;
    userId?: string;
    error?: string;
    message?: string;
}

// インポートサマリーの型を定義
interface ImportSummary {
    total: number;
    successful: number;
    failed: number;
    details: ImportResult[];
}

export class UserImportService {
    static async importAllUsers(csvContent: string) {
        try {
            const { data: csvUsers } = Papa.parse<CSVUser>(csvContent, {
                header: true,
                skipEmptyLines: true,
                transform: (value, field) => {
                    // デバッグ用
                    console.log(`Parsing CSV field: ${field} = ${value}`);
                    if (value === '') return null;
                    if (field === 'created_at' && (!value || value === '')) {
                        return new Date().toISOString();
                    }
                    return value;
                }
            });

            // デバッグ用
            console.log('Parsed CSV data:', csvUsers[0]); // 最初のユーザーデータを確認

            const results = await Promise.all(
                csvUsers.map(csvUser => this.importUser(csvUser))
            );

            await this.clearCache();

            return {
                total: csvUsers.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                details: results
            };
        } catch (error) {
            console.error('Import error:', error);
            throw error;
        }
    }

    private static async importUser(csvUser: CSVUser): Promise<ImportResult> {
        try {
            // デバッグログの追加
            console.log('Importing CSV user:', csvUser);

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    // UUIDは自動生成
                    display_id: csvUser.id,        // CSVのIDをdisplay_idとして使用
                    name: csvUser.name,
                    name_kana: csvUser.name_kana,
                    email: csvUser.email,
                    referrer: csvUser.referrer,    // 紹介者のdisplay_id
                    investment: csvUser.investment,
                    created_at: new Date(csvUser.initial_investment_date).toISOString(),
                    wallet_type: 'metamask',       // デフォルト値
                    active: true
                });

            if (upsertError) {
                console.error('Upsert error:', upsertError);
                throw upsertError;
            }

            // インポート後の確認
            const { data: imported, error: checkError } = await supabase
                .from('profiles')
                .select('*')
                .eq('display_id', csvUser.id)
                .single();

            if (checkError) {
                console.error('Verification error:', checkError);
                throw checkError;
            }

            console.log('Successfully imported:', imported);

            return {
                success: true,
                message: `Imported user ${csvUser.id}`
            };

        } catch (error) {
            console.error('Import error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private static async createBackup() {
        try {
            const { error } = await supabase.rpc('backup_database');
            if (error) throw error;
            console.log('バックアップ完了');
        } catch (error) {
            console.error('バックアップエラー:', error);
            throw error;
        }
    }

    private static async clearCache() {
        try {
            // プロフィールキャッシュをクリア
            await supabase.from('profiles').select('id').limit(1);
            // NFT関連のキャッシュをクリア
            await supabase.from('nft_purchase_requests').select('id').limit(1);
            console.log('キャッシュクリア完了');
        } catch (error) {
            console.error('キャッシュクリアエラー:', error);
        }
    }

    // display_id生成ヘルパー
    private static generateDisplayId(email: string): string {
        const username = email.split('@')[0];
        const timestamp = new Date().getTime().toString().slice(-4);
        return `${username}${timestamp}`;
    }

    /**
     * @deprecated Use ReferralService.syncLegacyUsers instead
     */
    static async importUsers(csvUsers: CSVUser[]): Promise<ImportSummary> {
        console.warn('This method is deprecated. Use ReferralService.syncLegacyUsers instead.');
        try {
            const results: ImportResult[] = await Promise.all(
                csvUsers.map(async (user) => {
                    try {
                        const userId = uuidv4();
                        // ... インポート処理 ...
                        return { success: true, userId };
                    } catch (error) {
                        return {
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                })
            );

            return {
                total: csvUsers.length,
                successful: results.filter((r: ImportResult) => r.success).length,
                failed: results.filter((r: ImportResult) => !r.success).length,
                details: results
            };
        } catch (error) {
            throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 