'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayoutClient({
    children  // childrenプロパティを追加
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        
        if (session.user.email !== 'testadmin@gmail.com') {
            router.push('/dashboard')
            return
        }

        setUser(session.user)
    }

    // ログアウト処理を追加
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}  // ログアウト処理を渡す
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-6">
                    {children}  {/* 子コンポーネントを表示 */}
                </main>
            </div>
        </div>
    )
} 