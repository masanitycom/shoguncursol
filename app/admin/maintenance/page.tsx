'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { supabase } from '@/lib/supabase'
import { Button, Alert, Space, Table, message as antMessage, Modal } from 'antd'
import { BackupButton } from './components/BackupButton'
import { ImportOutlined } from '@ant-design/icons'
import CSVPreprocessorUI from './csv-preprocessor'

// スプレッドシートから取得するデータの型を定義
interface SpreadsheetUserData {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    investment?: string;
    referrer?: string;
    initial_investment_date?: string;
}

interface ImportResult {
    data: any[];
    error?: string;
}

export default function MaintenancePage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [spreadsheetId, setSpreadsheetId] = useState<string>('')
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUser(session.user)
            } else {
                router.push('/login')
            }
        }
        getUser()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleSpreadsheetImport = async () => {
        try {
            if (!spreadsheetId) {
                setError('スプレッドシートIDを入力してください')
                return
            }
            setLoading(true)

            // まず既存のデータを削除（管理者以外）
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .neq('role', 'admin')

            if (deleteError) throw deleteError

            // 削除後に少し待機（DBの反映を待つ）
            await new Promise(resolve => setTimeout(resolve, 1000))

            // スプレッドシートからデータを取得
            const response = await fetch('/api/spreadsheet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ spreadsheetId })
            })

            const result = await response.json() as ImportResult
            
            if (!result.data || result.data.length === 0) {
                throw new Error('インポートするデータがありません')
            }

            // 現在の日時を2024年に設定
            const currentDate = new Date()
            currentDate.setFullYear(2024)

            // 型を明示的に指定
            const newProfiles = result.data.map((userData: SpreadsheetUserData) => ({
                id: crypto.randomUUID(),
                display_id: userData.id,
                name: userData.name,
                email: userData.email || `${userData.id}@temp.example.com`,
                phone: userData.phone || null,
                investment: userData.investment ? parseFloat(userData.investment) : null,
                referrer: userData.referrer || null,
                created_at: currentDate.toISOString(),
                initial_investment_date: userData.initial_investment_date || null,
                active: true,
                role: 'user'
            }))

            // 10件ずつに分割してインポート
            for (let i = 0; i < newProfiles.length; i += 10) {
                const batch = newProfiles.slice(i, i + 10)
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(batch)

                if (insertError) {
                    console.error('バッチインポートエラー:', insertError)
                    throw insertError
                }
            }

            antMessage.success(`インポート完了（${newProfiles.length}件）`)
            router.refresh()
            router.push('/admin/users')

        } catch (error) {
            console.error('インポートエラー:', error)
            setError(error instanceof Error ? error.message : 'インポートに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAllUsers = async () => {
        Modal.confirm({
            title: '確認',
            content: '管理者以外のすべてのユーザーを削除します。この操作は取り消せません。続行しますか？',
            okText: '削除',
            cancelText: 'キャンセル',
            onOk: async () => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .delete()
                        .neq('role', 'admin')

                    if (error) {
                        throw error
                    }

                    antMessage.success('指定したユーザー以外の削除が完了しました')
                } catch (error) {
                    console.error('削除エラー:', error)
                    antMessage.error('ユーザーの削除に失敗しました')
                }
            }
        })
    }

    const fixDates = async () => {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('*')

            if (error) throw error

            // 日付を2024年に修正
            const updates = profiles.map(profile => ({
                id: profile.id,
                created_at: profile.created_at.replace('2025', '2024')
            }))

            for (const update of updates) {
                await supabase
                    .from('profiles')
                    .update({ created_at: update.created_at })
                    .eq('id', update.id)
            }

            antMessage.success('日付の修正が完了しました')
        } catch (error) {
            console.error('日付修正エラー:', error)
            antMessage.error('日付の修正に失敗しました')
        }
    }

    const clearAndReimport = async () => {
        try {
            setLoading(true)
            
            // 保護対象のプロファイルを取得（管理者と新規登録ユーザー）
            const { data: protectedProfiles } = await supabase
                .from('profiles')
                .select('*')
                .or('role.eq.admin,created_through.eq.signup')
            
            console.log('保護対象プロファイル:', protectedProfiles)
            
            // インポート対象のプロファイルのみを削除
            const { data: deletedProfiles } = await supabase
                .from('profiles')
                .delete()
                .not('id', 'in', (protectedProfiles || []).map(p => p.id))
                .select()
            
            console.log('削除対象プロファイル:', deletedProfiles)
            
            // スプレッドシートからデータを再インポート
            await handleSpreadsheetImport()
            
        } catch (error) {
            console.error('再インポートエラー:', error)
            setError('データの再インポートに失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const clearAllData = async () => {
        try {
            setLoading(true)
            
            // 管理者以外の全プロファイルを削除
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .neq('role', 'admin')
                
            if (deleteError) throw deleteError
            
            // 削除後にページをリロード
            router.refresh()
            
            antMessage.success('データを削除しました。次にインポートを実行してください。')
            
        } catch (error) {
            console.error('削除エラー:', error)
            setError('データの削除に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const runMaintenance = async (task: string) => {
        setLoading(true)
        try {
            let { data, error } = await supabase.rpc('run_maintenance', {
                task_name: task
            })
            
            if (error) throw error
            
            setMessage(`${task} completed successfully`)
        } catch (error: unknown) {  // 型を明示的に指定
            setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
        } finally {
            setLoading(false)
        }
    }

    const maintenanceTasks = [
        {
            name: 'Update Statistics',
            description: 'Updates database statistics for query optimization',
            action: () => runMaintenance('update_statistics')
        },
        {
            name: 'Refresh Materialized Views',
            description: 'Refreshes all materialized views with latest data',
            action: () => runMaintenance('refresh_views')
        },
        {
            name: 'Clean Up Dead Tuples',
            description: 'Removes dead tuples and reclaims space',
            action: () => runMaintenance('vacuum_analyze')
        },
        {
            name: 'Fix User Display IDs',
            description: 'Assigns missing display IDs to users',
            action: () => runMaintenance('fix_display_ids')
        }
    ]

    return (
        <div className="flex min-h-screen bg-gray-100">
            <AdminSidebar />
            <div className="flex-1">
                <Header 
                    user={user}
                    onLogout={handleLogout}
                />
                <main className="p-6">
                    <h1 className="text-2xl font-bold mb-6">メンテナンス</h1>
                    
                    {error && (
                        <Alert
                            message="エラー"
                            description={error}
                            type="error"
                            showIcon
                            className="mb-4"
                        />
                    )}
                    
                    {message && (
                        <Alert
                            message="成功"
                            description={message}
                            type="success"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            スプレッドシートID
                        </label>
                        <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                            placeholder="スプレッドシートIDを入力"
                        />
                    </div>

                    <Space direction="vertical" size="middle" className="w-full">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-4">データベースバックアップ</h2>
                            <BackupButton />
                        </div>
                    </Space>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <Button
                                type="primary"
                                icon={<ImportOutlined />}
                                onClick={handleSpreadsheetImport}
                                loading={loading}
                                className="bg-blue-500"
                            >
                                スプレッドシートからインポート
                            </Button>
                            <BackupButton />
                        </div>

                        <CSVPreprocessorUI />
                    </div>
                </main>
            </div>
        </div>
    )
} 