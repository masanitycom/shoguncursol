'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AdminHeaderProps {
    user: User | null;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            // セッションをクリアしてからリダイレクト
            await supabase.auth.signOut()
            router.push('/admin/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <header className="bg-gray-800 py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/dashboard" className="text-white hover:text-gray-300">
                        ダッシュボード
                    </Link>
                    <Link href="/admin/organization" className="text-white hover:text-gray-300">
                        組織図
                    </Link>
                    <Link href="/admin/settings" className="text-white hover:text-gray-300">
                        設定
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-white">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        ログアウト
                    </button>
                </div>
            </div>
        </header>
    )
} 