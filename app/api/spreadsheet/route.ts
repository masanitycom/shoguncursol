import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';

interface SpreadsheetRequestBody {
    spreadsheetId: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as SpreadsheetRequestBody;
        const { spreadsheetId } = body;

        if (!spreadsheetId) {
            return NextResponse.json(
                { error: 'Spreadsheet ID is required' },
                { status: 400 }
            );
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        try {
            // まずスプレッドシートの情報を取得
            const spreadsheet = await sheets.spreadsheets.get({
                spreadsheetId,
            });

            // 最初のシートの名前を取得
            const firstSheet = spreadsheet.data.sheets?.[0];
            const sheetName = firstSheet?.properties?.title;

            if (!sheetName) {
                return NextResponse.json(
                    { error: 'シートが見つかりません' },
                    { status: 404 }
                );
            }

            // データを取得
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A1:J1000`,  // 動的にシート名を使用
            });

            const rows = response.data.values;
            if (!rows || rows.length === 0) {
                return NextResponse.json(
                    { error: 'データが見つかりません' },
                    { status: 404 }
                );
            }

            // ヘッダー行を取得
            const headers = rows[0].map(header => header.toLowerCase());
            
            // データ行を処理
            const data = rows.slice(1).map((row) => {
                const item: any = {};
                headers.forEach((header: string, index: number) => {
                    item[header] = row[index] || '';
                });
                return item;
            });

            return NextResponse.json({ 
                data,
                sheetName, // シート名も返す
                totalRows: data.length 
            });

        } catch (error: any) {
            console.error('Google Sheets API エラー:', error);
            return NextResponse.json(
                { error: `スプレッドシートの読み込みに失敗: ${error.message}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('リクエスト処理エラー:', error);
        return NextResponse.json(
            { error: 'リクエストの処理に失敗しました' },
            { status: 500 }
        );
    }
} 