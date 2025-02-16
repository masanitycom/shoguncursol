'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/auth/AuthProvider'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { supabase } from '@/lib/supabase'

export default function AdminLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        // 管理者権限チェック
        const checkAdminRole = async () => {
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', user.id)
                .single()

            if (!profile || profile.role !== 'admin') {
                router.push('/')
            }
        }

        checkAdminRole()
    }, [user, router])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
} 