import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // バックアップ用のデータ取得
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public')

    // 各テーブルのデータを取得
    const backupData: Record<string, any> = {}
    for (const table of tables || []) {
      const { data } = await supabase
        .from(table.table_name)
        .select('*')
      backupData[table.table_name] = data
    }

    // JSONファイルとして保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup_${timestamp}.json`

    return NextResponse.json({ 
      success: true,
      message: 'Backup completed',
      fileName,
      data: backupData
    })

  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Backup failed' 
    }, { status: 500 })
  }
} 