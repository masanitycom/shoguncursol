'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Header from '../../../components/Header'
import AdminSidebar from '../../../components/AdminSidebar'

// Supabaseのクエリ結果の型を定義
interface RawNFTResponse {
    id: string
    nft_master: {
        id: string
        name: string
        price: number
    }
    purchase_date: string
}

interface NFTMaster {
    id: string
    name: string
    price: number
}

interface UserNFT {
    id: string
    nft_master: NFTMaster
    purchase_date: string
}

interface OrganizationUser {
    id: string
    name_kana: string
    referrer_id: string | null
    first_investment_date: string | null
    last_investment_date: string | null
    total_investment: number
}

interface User {
    id: string
    name_kana: string
    email?: string
    name?: string
    referrer_id: string | null
    created_at?: string
    first_investment_date: string | null
    last_investment_date: string | null
    status?: 'active' | 'inactive'
    total_investment: number
    children: User[]
    level?: number
    total_descendants: number
}

export default function AdminOrganizationPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const usersPerPage = 50

    useEffect(() => {
        checkAuth()
        fetchUsers()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchUsers = async () => {
        try {
            // 別々のクエリを実行
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (usersError) throw usersError

            // 各ユーザーのNFT情報を取得
            const { data: nftsData, error: nftsError } = await supabase
                .from('user_nfts')
                .select(`
                    id,
                    user_id,
                    purchase_date,
                    nfts (
                        id,
                        name,
                        price
                    )
                `)

            if (nftsError) throw nftsError

            // ユーザーデータとNFTデータを結合
            const usersWithInvestments = usersData.map(user => {
                const userNfts = nftsData.filter(nft => nft.user_id === user.id)
                const investmentDates = userNfts
                    .map(nft => new Date(nft.purchase_date))
                    .sort((a, b) => a.getTime() - b.getTime())

                return {
                    ...user,
                    first_investment_date: investmentDates[0]?.toISOString() || null,
                    last_investment_date: investmentDates[investmentDates.length - 1]?.toISOString() || null,
                    total_investment: userNfts.reduce((sum, nft) => sum + (nft.nfts?.price || 0), 0)
                }
            })

            // ユーザーを階層構造に変換
            const usersMap = new Map()
            usersWithInvestments.forEach(user => {
                usersMap.set(user.id, { ...user, children: [] })
            })

            const rootUsers = []
            usersWithInvestments.forEach(user => {
                const userWithChildren = usersMap.get(user.id)
                if (user.referrer_id) {
                    const parent = usersMap.get(user.referrer_id)
                    if (parent) {
                        parent.children.push(userWithChildren)
                    } else {
                        rootUsers.push(userWithChildren)
                    }
                } else {
                    rootUsers.push(userWithChildren)
                }
            })

            setUsers(rootUsers)
        } catch (error) {
            console.error('Error fetching users:', error)
            setError(error.message)
        }
    }

    // ユーザーの展開/折りたたみを切り替え
    const toggleExpand = (userId: string) => {
        const newExpanded = new Set(expandedUsers)
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId)
        } else {
            newExpanded.add(userId)
        }
        setExpandedUsers(newExpanded)
    }

    // 検索フィルター
    const filterUsers = (users: User[]): User[] => {
        if (!searchTerm) return users
        const term = searchTerm.toLowerCase()
        
        const filtered: User[] = []
        const searchInTree = (user: User) => {
            const matches = 
                user.email?.toLowerCase().includes(term) ||
                user.name?.toLowerCase().includes(term) ||
                user.id.toLowerCase().includes(term)
            
            if (matches) {
                filtered.push(user)
            }
            user.children.forEach(searchInTree)
        }
        users.forEach(searchInTree)
        return filtered
    }

    // ページネーション
    const paginateUsers = (users: User[]): User[] => {
        const startIndex = (currentPage - 1) * usersPerPage
        return users.slice(startIndex, startIndex + usersPerPage)
    }

    const renderUserTree = (user: User, level: number = 0) => (
        <div key={user.id} className="relative">
            <div className={`
                p-4 mb-2 rounded-lg hover:bg-gray-700 transition-colors duration-200
                ${level === 0 ? 'bg-gray-700' : 'bg-gray-800'}
                ${user.children.length ? 'border-l-4 border-blue-500' : ''}
            `}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            {user.children.length > 0 && (
                                <button
                                    onClick={() => toggleExpand(user.id)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    {expandedUsers.has(user.id) ? '▼' : '▶'}
                                </button>
                            )}
                            <div className={`w-3 h-3 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <h4 className="text-lg font-medium text-white">
                                {user.name || 'No Name'}
                            </h4>
                            {user.total_descendants > 0 && (
                                <span className="text-sm text-gray-400">
                                    (総メンバー: {user.total_descendants}名)
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                                <p>ID: {user.id.slice(0, 8)}...</p>
                                <p>Email: {user.email}</p>
                                <p>登録日: {new Date(user.created_at || '').toLocaleDateString('ja-JP')}</p>
                            </div>
                            <div>
                                <p>初回投資: {user.first_investment_date 
                                    ? new Date(user.first_investment_date).toLocaleDateString('ja-JP')
                                    : '未投資'}</p>
                                <p>最終投資: {user.last_investment_date
                                    ? new Date(user.last_investment_date).toLocaleDateString('ja-JP')
                                    : '未投資'}</p>
                                <p>総投資額: {user.total_investment.toLocaleString()} USDT</p>
                            </div>
                        </div>
                    </div>
                    {user.children.length > 0 && (
                        <div className="text-sm text-gray-400">
                            紹介数: {user.children.length}
                        </div>
                    )}
                </div>
            </div>
            {expandedUsers.has(user.id) && user.children.length > 0 && (
                <div className="ml-8 pl-4 border-l border-gray-600">
                    {user.children.map(child => renderUserTree(child, level + 1))}
                </div>
            )}
        </div>
    )

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-medium text-white">組織図</h3>
                            <div className="flex space-x-4">
                                <input
                                    type="text"
                                    placeholder="ユーザーを検索..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-700 text-white px-4 py-2 rounded"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 p-6 rounded-lg">
                            {paginateUsers(filterUsers(users)).map(user => renderUserTree(user))}
                        </div>

                        {/* ページネーション */}
                        <div className="mt-4 flex justify-center space-x-2">
                            {Array.from({ length: Math.ceil(users.length / usersPerPage) }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 rounded ${
                                        currentPage === i + 1
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 