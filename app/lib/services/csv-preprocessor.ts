interface CSVRow {
    [key: string]: string;
}

export class CSVPreprocessor {
    static processHeaders(headers: string[]): string[] {
        return headers.map(header => this.normalizeHeader(header));
    }

    static normalizeHeader(header: string): string {
        return header
            .toLowerCase()
            .trim()
            .replace(/[\s\-]+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
    }

    static processRow(row: CSVRow): CSVRow {
        const processedRow: CSVRow = {};
        for (const [key, value] of Object.entries(row)) {
            processedRow[this.normalizeHeader(key)] = this.normalizeValue(value);
        }
        return processedRow;
    }

    static normalizeValue(value: string): string {
        return value.trim();
    }

    static validateRow(row: CSVRow, requiredFields: string[]): boolean {
        return requiredFields.every(field => 
            field in row && row[field] !== undefined && row[field] !== ''
        );
    }

    static async processCSV(
        file: File,
        requiredFields: string[] = []
    ): Promise<{
        headers: string[],
        rows: CSVRow[],
        errors: string[]
    }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const errors: string[] = [];
            let headers: string[] = [];
            const rows: CSVRow[] = [];

            reader.onload = (event) => {
                try {
                    const csv = event.target?.result as string;
                    const lines = csv.split('\n');
                    
                    if (lines.length === 0) {
                        reject(new Error('Empty CSV file'));
                        return;
                    }

                    // ヘッダーの処理
                    headers = this.processHeaders(lines[0].split(','));

                    // データ行の処理
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        const values = line.split(',');
                        const row: CSVRow = {};
                        
                        headers.forEach((header, index) => {
                            row[header] = this.normalizeValue(values[index] || '');
                        });

                        if (!this.validateRow(row, requiredFields)) {
                            errors.push(`Line ${i + 1}: Missing required fields`);
                            continue;
                        }

                        rows.push(row);
                    }

                    resolve({ headers, rows, errors });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }
} 