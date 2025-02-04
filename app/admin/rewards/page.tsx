'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'
import { 
    CalculatorIcon, 
    ArrowPathIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline'

interface RewardRequest {
    id: string
    user_name: string
    user_id: string
    request_amount: number
    fee_amount: number
    request_date: string
    status: '保留中' | '送金済' | '拒否'
    usdt_address: string
    wallet_type: 'EVO' | 'その他'
}

interface UserRewardInfo {
    user_name: string
    user_id: string
    total_rewards: number
    pending_rewards: number
    fee_percentage: string
    last_reward_date: string
}

export default function RewardsPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'requests' | 'info'>('requests')
    const [searchTerm, setSearchTerm] = useState('')
    const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([])
    const [userRewardInfo, setUserRewardInfo] = useState<UserRewardInfo[]>([])

    useEffect(() => {
        checkAuth()
        fetchRewardRequests()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchRewardRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('reward_requests')
                .select('*')
                .order('request_date', { ascending: false })

            if (error) throw error
            setRewardRequests(data || [])
        } catch (error) {
            console.error('Error fetching reward requests:', error)
        }
    }

    const handleStatusChange = async (requestId: string, newStatus: '送金済' | '拒否') => {
        try {
            const { error } = await supabase
                .from('reward_requests')
                .update({ status: newStatus })
                .eq('id', requestId)

            if (error) throw error
            fetchRewardRequests()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const calculateFee = (amount: number, walletType: 'EVO' | 'その他') => {
        const feePercentage = walletType === 'EVO' ? 0.055 : 0.08
        return amount * feePercentage
    }

    const exportToCsv = () => {
        // CSVエクスポート処理
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
                        <div className="flex justify-between items-center">
                            <h3 className="text-3xl font-medium text-white">報酬管理</h3>
                            <button
                                onClick={exportToCsv}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                CSVエクスポート
                            </button>
                        </div>

                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex space-x-4">
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className={`px-4 py-2 rounded-lg ${
                                            activeTab === 'requests' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        報酬申請
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={`px-4 py-2 rounded-lg ${
                                            activeTab === 'info' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        ユーザー報酬情報
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="ユーザー名またはIDで検索"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg"
                                />
                            </div>

                            {activeTab === 'requests' ? (
                                <table className="min-w-full bg-gray-800 text-white">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left">ユーザー</th>
                                            <th className="px-6 py-3 text-left">申請額</th>
                                            <th className="px-6 py-3 text-left">手数料</th>
                                            <th className="px-6 py-3 text-left">申請日</th>
                                            <th className="px-6 py-3 text-left">状態</th>
                                            <th className="px-6 py-3 text-left">USDTアドレス</th>
                                            <th className="px-6 py-3 text-left">ウォレット</th>
                                            <th className="px-6 py-3 text-left">アクション</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rewardRequests.map((request) => (
                                            <tr key={request.id} className="border-t border-gray-700">
                                                <td className="px-6 py-4">{request.user_name}</td>
                                                <td className="px-6 py-4">${request.request_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">${request.fee_amount.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    {new Date(request.request_date).toLocaleDateString('ja-JP')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                        request.status === '送金済' 
                                                            ? 'bg-green-900 text-green-300'
                                                            : request.status === '拒否'
                                                            ? 'bg-red-900 text-red-300'
                                                            : 'bg-yellow-900 text-yellow-300'
                                                    }`}>
                                                        {request.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <span className="truncate w-32">{request.usdt_address}</span>
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(request.usdt_address)}
                                                            className="ml-2 text-gray-400 hover:text-white"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{request.wallet_type}</td>
                                                <td className="px-6 py-4">
                                                    {request.status === '保留中' && (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => handleStatusChange(request.id, '送金済')}
                                                                className="text-green-500 hover:text-green-400"
                                                            >
                                                                送金済
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(request.id, '拒否')}
                                                                className="text-red-500 hover:text-red-400"
                                                            >
                                                                拒否
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="min-w-full bg-gray-800 text-white">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left">ユーザー名</th>
                                            <th className="px-6 py-3 text-left">ユーザーID</th>
                                            <th className="px-6 py-3 text-left">総報酬額</th>
                                            <th className="px-6 py-3 text-left">保留中の報酬</th>
                                            <th className="px-6 py-3 text-left">手数料</th>
                                            <th className="px-6 py-3 text-left">最終報酬日</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userRewardInfo.map((info) => (
                                            <tr key={info.user_id} className="border-t border-gray-700">
                                                <td className="px-6 py-4">{info.user_name}</td>
                                                <td className="px-6 py-4">{info.user_id}</td>
                                                <td className="px-6 py-4">${info.total_rewards.toLocaleString()}</td>
                                                <td className="px-6 py-4">${info.pending_rewards.toLocaleString()}</td>
                                                <td className="px-6 py-4">{info.fee_percentage}</td>
                                                <td className="px-6 py-4">
                                                    {new Date(info.last_reward_date).toLocaleDateString('ja-JP')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 