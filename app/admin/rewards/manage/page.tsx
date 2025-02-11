'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { message as antMessage } from 'antd'

declare const window: Window & typeof globalThis
declare const document: Document
declare const navigator: Navigator

interface Document {
    createElement(tagName: 'a'): HTMLAnchorElement;
    createElement(tagName: string): HTMLElement;
    body: HTMLElement & {
        appendChild(node: HTMLElement): void;
        removeChild(node: HTMLElement): void;
    };
}

interface Navigator {
    clipboard: {
        writeText(text: string): Promise<void>;
    };
}

interface RewardClaim {
    id: string
    user: {
        id: string
        email: string
        name: string
    }
    amount: number
    wallet_type: 'EVO' | 'other'
    fee: number
    final_amount: number
    wallet_address: string
    status: 'pending' | 'completed'
    created_at: string
    completed_at: string | null
}

export default function ManageRewardsPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [claims, setClaims] = useState<RewardClaim[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
        fetchClaims()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchClaims = async () => {
        try {
            const { data, error } = await supabase
                .from('reward_claims_with_users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setClaims(data || [])
        } catch (error: any) {
            console.error('Error fetching claims:', error)
            setError('報酬申請の取得に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteClaim = async (claimId: string) => {
        setLoading(true)
        try {
            const { error } = await supabase
                .from('reward_claims')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', claimId)

            if (error) throw error
            fetchClaims()
        } catch (error: any) {
            console.error('Error completing claim:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadCSV = () => {
        const headers = ['申請日', '名前', 'ID', '報酬額', 'ウォレット種類', '手数料', '送金額', 'USDTアドレス', 'ステータス']
        const rows = claims.map(claim => [
            new Date(claim.created_at).toLocaleDateString('ja-JP'),
            claim.user.name || 'No Name',
            claim.user.id,
            claim.amount,
            claim.wallet_type,
            claim.fee,
            claim.final_amount,
            claim.wallet_address,
            claim.status === 'completed' ? '送金済み' : '未送金'
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n')

        downloadCSV(csvContent)
    }

    const downloadCSV = (csvContent: string) => {
        // Next.js環境でのwindowチェック
        if (typeof window === 'undefined') return

        try {
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `reward-claims-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
            antMessage.error('CSVのダウンロードに失敗しました')
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-medium text-white">報酬申請一覧</h3>
                            <button
                                onClick={handleDownloadCSV}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                CSVダウンロード
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-white rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申請日</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">報酬額</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ウォレット</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手数料</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">送金額</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USDTアドレス</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {claims.map(claim => (
                                        <tr key={claim.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(claim.created_at).toLocaleDateString('ja-JP')}
                                            </td>
                                            <td className="px-6 py-4">{claim.user.name || 'No Name'}</td>
                                            <td className="px-6 py-4">{claim.user.id}</td>
                                            <td className="px-6 py-4">{claim.amount} USDT</td>
                                            <td className="px-6 py-4">{claim.wallet_type}</td>
                                            <td className="px-6 py-4">{claim.fee} USDT</td>
                                            <td className="px-6 py-4">{claim.final_amount} USDT</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(claim.wallet_address)
                                                            antMessage.success('アドレスをコピーしました')
                                                        } catch (error) {
                                                            console.error('Copy error:', error)
                                                            antMessage.error('コピーに失敗しました')
                                                        }
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    {claim.wallet_address}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {claim.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleCompleteClaim(claim.id)}
                                                        disabled={loading}
                                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        送金完了
                                                    </button>
                                                ) : (
                                                    <span className="text-green-600">送金済み</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 