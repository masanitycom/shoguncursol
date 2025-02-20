'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

interface WeeklyProfit {
    id: string
    week_start: string
    week_end: string
    profit_amount: number
    distribution_amount: number
    distributed_amount: number
    undistributed_amount: number
    status: 'pending' | 'completed'
    created_at: string
}

export default function ManageWeeklyProfitsPage() {
    const [user, setUser] = useState<any>(null)
    const [profits, setProfits] = useState<WeeklyProfit[]>([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                    window.location.replace('/admin/login')
                    return
                }
                
                setUser(session.user)
            } catch (error) {
                console.error('Auth check error:', error)
                window.location.replace('/admin/login')
            }
        }

        checkAuth()
    }, [])

    useEffect(() => {
        fetchProfits()
    }, [])

    const fetchProfits = async () => {
        try {
            const { data, error } = await supabase
                .from('weekly_company_profits')
                .select('*')
                .order('week_start', { ascending: false })

            if (error) throw error
            setProfits(data || [])
        } catch (error) {
            console.error('Error fetching profits:', error)
            setMessage({ type: 'error', text: '利益データの取得に失敗しました' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('本当にこの記録を削除しますか？')) return

        try {
            const { error } = await supabase
                .from('weekly_company_profits')
                .delete()
                .eq('id', id)

            if (error) throw error

            setMessage({ type: 'success', text: '記録を削除しました' })
            fetchProfits()
        } catch (error) {
            console.error('Error deleting profit:', error)
            setMessage({ type: 'error', text: '削除に失敗しました' })
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={async () => {
                    try {
                        await supabase.auth.signOut()
                    } catch (error) {
                        console.error('Logout error:', error)
                        window.location.replace('/admin/login')
                    }
                }}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white mb-8">週次利益管理</h3>
                        
                        {message && (
                            <div className={`mb-4 p-4 rounded-lg ${
                                message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">期間</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">利益額</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">分配額</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">未分配額</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ステータス</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {profits.map((profit) => (
                                        <tr key={profit.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(profit.week_start).toLocaleDateString()} - {new Date(profit.week_end).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                ${profit.profit_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                ${profit.distribution_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                ${profit.undistributed_amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    profit.status === 'completed' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {profit.status === 'completed' ? '完了' : '保留中'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                <button
                                                    onClick={() => handleDelete(profit.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    削除
                                                </button>
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