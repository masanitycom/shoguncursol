'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'

interface User {
    id: string
    name: string
    email: string
    referrer: string | null
}

export default function AdminReferrerPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [referrers, setReferrers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [newReferrer, setNewReferrer] = useState<User | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
                router.push('/admin/login')
                return
            }
            setUser(session.user)
            fetchReferrers()
        } catch (error) {
            console.error('Error checking auth:', error)
            router.push('/admin/login')
        }
    }

    const fetchReferrers = async () => {
        try {
            // 紹介者情報を取得するクエリ
            const { data, error } = await supabase
                .from('users')
                .select(`
                    id,
                    name,
                    email,
                    referrer_id,
                    referrer:users!referrer_id(
                        id,
                        name,
                        email
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            setReferrers(data || [])
        } catch (error) {
            console.error('Error fetching referrers:', error)
        } finally {
            setLoading(false)
        }
    }

    // ユーザー検索
    const searchUsers = async (term: string) => {
        if (!term) return

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, referrer')
            .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(10)

        if (error) {
            console.error('Error searching users:', error)
            return
        }

        setUsers(data)
    }

    // 紹介者の更新
    const updateReferrer = async () => {
        if (!selectedUser || !newReferrer) return

        try {
            setLoading(true)
            const { error } = await supabase
                .from('profiles')
                .update({ referrer: newReferrer.id })
                .eq('id', selectedUser.id)

            if (error) throw error

            // 更新成功
            setSelectedUser(null)
            setNewReferrer(null)
            setUsers([])
            setSearchTerm('')
        } catch (error) {
            console.error('Error updating referrer:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user}
                isAdmin={true}
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">紹介者設定</h1>

                    {/* ユーザー検索 */}
                    <div className="mb-8">
                        <input
                            type="text"
                            placeholder="ユーザーを検索..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                searchUsers(e.target.value)
                            }}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                        />
                    </div>

                    {/* 検索結果 */}
                    {users.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-white mb-4">検索結果</h2>
                            <div className="space-y-2">
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <p className="text-white">{user.name}</p>
                                        <p className="text-gray-400 text-sm">{user.email}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 選択されたユーザー */}
                    {selectedUser && (
                        <div className="mb-8">
                            <h2 className="text-white mb-4">選択されたユーザー</h2>
                            <div className="p-4 bg-blue-900 rounded">
                                <p className="text-white">{selectedUser.name}</p>
                                <p className="text-gray-300">{selectedUser.email}</p>
                            </div>

                            {/* 紹介者検索 */}
                            <div className="mt-4">
                                <input
                                    type="text"
                                    placeholder="紹介者を検索..."
                                    onChange={(e) => searchUsers(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded"
                                />
                            </div>

                            {/* 紹介者として選択可能なユーザー一覧 */}
                            {users.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {users
                                        .filter(u => u.id !== selectedUser.id)
                                        .map(user => (
                                            <div
                                                key={user.id}
                                                className="p-4 bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                                                onClick={() => setNewReferrer(user)}
                                            >
                                                <p className="text-white">{user.name}</p>
                                                <p className="text-gray-400 text-sm">{user.email}</p>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* 更新ボタン */}
                            {newReferrer && (
                                <button
                                    onClick={updateReferrer}
                                    disabled={loading}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? '更新中...' : '紹介者を更新'}
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
} 