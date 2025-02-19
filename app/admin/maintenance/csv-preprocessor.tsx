'use client';

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="es2015" />
import { useState, type ChangeEvent } from 'react';
import { CSVPreprocessor } from '@/lib/services/csv-preprocessor';
import Papa from 'papaparse';
import { 
    CustomWindow, 
    CustomAnchor, 
    CustomDocument,
    isCustomWindow,
    isCustomDocument,
    isCustomAnchor,
    FileWithPath,
    DragEvent
} from '@/types/dom';

interface ProcessedUserData {
    id: string;
    name: string;
    investment: number;
    referrer?: string;
    parentid?: string;
    position?: string;
    created_at: string;
    phone?: string;
    email: string;
    initial_investment_date: string;
}

interface ProcessedResult {
    success: ProcessedUserData[];
    errors: { row: number; error: string; }[];
}

// ファイル入力要素の型定義
type FileInputElement = HTMLInputElement & {
    files: File[];
}

declare const document: CustomDocument;
declare const window: CustomWindow;

// エラー型を定義
interface ProcessError {
    row: number;
    error: string;
}

const CSVPreprocessorUI = () => {
    const [errors, setErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const downloadCSV = (content: string, filename: string) => {
        try {
            const blob = new Blob([content], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a') as HTMLAnchorElement;

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    };

    const handleFileUpload = async (event: ChangeEvent<FileInputElement>) => {
        const files = event.target.files;
        if (!files || !files[0]) return;

        const file = files[0];
        setIsProcessing(true);
        setErrors([]);
        setSuccess('');
        setError(null);

        try {
            const result = await CSVPreprocessor.preprocessCSV(file);

            if (result.errors.length > 0) {
                // エラーメッセージの配列に変換
                setErrors(result.errors.map(err => 
                    `行 ${err.row}: ${err.error}`
                ));
                return;
            }

            // 検証済みデータのダウンロード
            const processedCSV = Papa.unparse(result.success);
            downloadCSV(processedCSV, `processed_${file.name}`);

            setSuccess('CSVファイルの処理が完了しました。処理済みファイルがダウンロードされます。');

        } catch (error) {
            console.error('CSV processing error:', error);
            setError('CSVの処理中にエラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-white mb-4">CSVデータ前処理ツール</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300">
                    CSVファイルを選択
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={isProcessing}
                        className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                </label>
            </div>

            {error && (
                <div className="bg-red-900/50 p-4 rounded mb-4">
                    <h3 className="text-red-400 font-medium">{error}</h3>
                </div>
            )}

            {isProcessing && (
                <div className="text-gray-500 mb-4">
                    処理中...
                </div>
            )}

            {errors.length > 0 && (
                <div className="bg-red-900/50 p-4 rounded mb-4">
                    <h3 className="text-red-400 font-medium">エラー:</h3>
                    <ul className="list-disc pl-5">
                        {errors.map((error, index) => (
                            <li key={index} className="text-red-300">{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {success && (
                <div className="bg-green-900/50 p-4 rounded mb-4">
                    <p className="text-green-300">{success}</p>
                </div>
            )}

            <div className="mt-4">
                <h3 className="font-medium text-gray-300 mb-2">必要なCSVフォーマット:</h3>
                <pre className="bg-gray-900/50 p-3 rounded text-sm text-gray-300">
                    id,name,investment,referrer,parentid,position,created_at,phone,email,initial_investment_date{'\n'}
                    USER001,山田太郎,1000,REF001,PARENT001,left,2024-01-01,090-1234-5678,yamada@example.com,2024-01-01
                </pre>
            </div>
        </div>
    );
};

export default CSVPreprocessorUI; 