import { NextResponse } from 'next/server'
import { MigrationService } from '../../lib/services/migration'

interface MigrationRequestBody {
    users: any[]; // または具体的なユーザー型を定義
}

export async function POST(req: Request) {
    try {
        const body = await req.json() as MigrationRequestBody;
        const { users } = body;
        const result = await MigrationService.migrateAllUsers(users)
        return NextResponse.json(result)
    } catch (error) {
        console.error('Migration error:', error)
        return NextResponse.json({ 
            error: 'Migration failed',
            details: error
        }, { 
            status: 500 
        })
    }
} 