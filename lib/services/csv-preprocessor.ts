import Papa from 'papaparse';

export interface RawCSVData {
    id: string;
    name: string;
    investment: string;
    referrer: string;
    parentid: string;
    position: string;
    created_at: string;
    phone: string;
    email: string;
    initial_investment_date: string;
}

export interface ProcessedUserData {
    display_id: string;
    name: string;
    name_kana: string;
    email: string;
    phone: string;
    investment: number;
    referrer_id: string | null;
    parent_id: string | null;
    position: 'left' | 'right' | null;
    created_at: string;
    initial_investment_date: string | null;
}

export class CSVPreprocessor {
    static async preprocessCSV(file: File): Promise<{
        success: ProcessedUserData[];
        errors: { row: number; error: string }[];
    }> {
        try {
            const rawData = await this.parseCSV(file);
            const results = {
                success: [] as ProcessedUserData[],
                errors: [] as { row: number; error: string }[]
            };

            // バッチ処理で各行を処理
            for (let i = 0; i < rawData.length; i++) {
                try {
                    const processedData = this.transformRow(rawData[i], i);
                    results.success.push(processedData);
                } catch (error) {
                    results.errors.push({
                        row: i + 1,
                        error: error instanceof Error ? error.message : '不明なエラー'
                    });
                }
            }

            return results;
        } catch (error) {
            console.error('CSV処理エラー:', error);
            throw error;
        }
    }

    private static transformRow(row: RawCSVData, index: number): ProcessedUserData {
        // IDの検証
        if (!row.id?.trim()) {
            throw new Error(`ID（display_id）が未設定です（行: ${index + 1}）`);
        }

        // 名前の検証
        if (!row.name?.trim()) {
            throw new Error(`名前が未設定です（ID: ${row.id}）`);
        }

        // メールアドレスの処理
        const email = this.validateEmail(row.email, row.id);

        // 投資額の処理
        const investment = this.validateInvestment(row.investment, row.id);

        // 日付の処理
        const dates = this.processDates(row, index);

        return {
            display_id: row.id.trim(),
            name: row.name.trim(),
            name_kana: this.extractNameKana(row.name),
            email: email,
            phone: this.formatPhoneNumber(row.phone),
            investment: investment,
            referrer_id: row.referrer?.trim() || null,
            parent_id: row.parentid?.trim() || null,
            position: this.validatePosition(row.position),
            ...dates
        };
    }

    private static validateEmail(email: string, id: string): string {
        const trimmedEmail = email?.trim() || '';
        if (!trimmedEmail) {
            return `${id}@temporary.com`;
        }
        // 簡易的なメールアドレスの形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            console.warn(`不正なメールアドレス形式です（ID: ${id}）。仮のアドレスを使用します。`);
            return `${id}@temporary.com`;
        }
        return trimmedEmail;
    }

    private static validateInvestment(investment: string, id: string): number {
        const value = parseFloat(investment?.trim() || '0');
        if (isNaN(value)) {
            console.warn(`不正な投資額です（ID: ${id}）。0として処理します。`);
            return 0;
        }
        return value;
    }

    private static processDates(row: RawCSVData, index: number): {
        created_at: string;
        initial_investment_date: string | null;
    } {
        let created_at: string;
        let initial_investment_date: string | null = null;

        try {
            created_at = row.created_at?.trim() ? 
                this.formatDate(row.created_at) : 
                new Date().toISOString();
        } catch (error) {
            console.warn(`作成日の変換に失敗しました（行: ${index + 1}）。現在の日時を使用します。`);
            created_at = new Date().toISOString();
        }

        try {
            initial_investment_date = row.initial_investment_date?.trim() ? 
                this.formatDate(row.initial_investment_date) : 
                null;
        } catch (error) {
            console.warn(`投資日の変換に失敗しました（行: ${index + 1}）`);
        }

        return { created_at, initial_investment_date };
    }

    private static parseCSV(file: File): Promise<RawCSVData[]> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                encoding: 'UTF-8',
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('CSVパースエラー: ' + JSON.stringify(results.errors)));
                    } else {
                        resolve(results.data as RawCSVData[]);
                    }
                },
                error: (error) => reject(error)
            });
        });
    }

    private static formatDate(dateStr: string): string {
        try {
            // 日付フォーマットの正規化
            let normalizedDate = dateStr;
            
            // YYYY/MM/DD形式をYYYY-MM-DD形式に変換
            if (dateStr.includes('/')) {
                normalizedDate = dateStr.split('/').join('-');
            }
            
            // 日本の日付形式（YYYY年MM月DD日）に対応
            if (dateStr.includes('年')) {
                normalizedDate = dateStr
                    .replace('年', '-')
                    .replace('月', '-')
                    .replace('日', '');
            }

            // 時刻部分がない場合は追加
            if (!normalizedDate.includes(':')) {
                normalizedDate += 'T00:00:00Z';
            }

            const date = new Date(normalizedDate);
            if (isNaN(date.getTime())) {
                // フォールバック: 別の日付パース方法を試す
                const [year, month, day] = normalizedDate.split(/[-/年月日]/);
                if (year && month && day) {
                    const parsedDate = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day)
                    );
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate.toISOString();
                    }
                }
                throw new Error(`不正な日付形式: ${dateStr}`);
            }
            return date.toISOString();
        } catch (error) {
            console.error('日付変換エラー:', error, 'for date:', dateStr);
            // エラーの場合は現在の日付を使用
            return new Date().toISOString();
        }
    }

    private static formatPhoneNumber(phone: string): string {
        return phone ? phone.replace(/[^\d]/g, '') : '';
    }

    private static validatePosition(position: string): 'left' | 'right' | null {
        if (!position) return null;
        const pos = position.toLowerCase();
        if (pos !== 'left' && pos !== 'right') {
            throw new Error(`不正なposition値: ${position}`);
        }
        return pos as 'left' | 'right';
    }

    private static extractNameKana(name: string): string {
        return name;
    }
} 