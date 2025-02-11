'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Papa, { ParseResult } from 'papaparse';  // ParseErrorは削除

// CSVデータの型を定義
interface CSVRow {
    id: string;
    name: string;
    investment: string;
    referrer: string;
    parentId: string;
    position: string;
    phone: string;
    email: string;
    initial_investment_date: string;
}

// メタデータを削除
export default function ImportUsersPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.currentTarget as unknown as { files: File[] | null }
        if (!input.files?.[0]) return;
        setLoading(true);

        try {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            Papa.parse<CSVRow>(file, {
                header: true,
                dynamicTyping: true,
                complete: async (results: ParseResult<CSVRow>) => {
                    try {
                        const rows = results.data;
                        
                        for (const row of rows) {
                            const { error } = await supabase
                                .from('user_data')
                                .insert({
                                    id: row.id,
                                    name: row.name,
                                    investment: parseInt(row.investment) || 0,
                                    referrer: row.referrer || null,
                                    parent_id: row.parentId || null,
                                    position: row.position || null,
                                    phone: row.phone || null,
                                    email: row.email || null,
                                    initial_investment_date: row.initial_investment_date || null
                                });

                            if (error) throw error;
                        }

                        setResult({
                            success: true,
                            total: rows.length
                        });
                    } catch (error: any) {
                        console.error('Import error:', error);
                        setError('インポートに失敗しました');
                    }
                },
                error: (error: Error, file: File) => {
                    console.error('CSV parse error:', error);
                    setError(error.message);
                }
            });
        } catch (error: any) {
            console.error('File read error:', error);
            setError('ファイルの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">ユーザーインポート</h1>

            <div className="mb-4">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                />
            </div>

            {loading && (
                <div className="text-blue-600">
                    インポート中...
                </div>
            )}

            {result && (
                <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {result.success ? (
                        <p>インポート完了: {result.total}件</p>
                    ) : (
                        <p>エラー: {error}</p>
                    )}
                </div>
            )}
        </div>
    );
} 