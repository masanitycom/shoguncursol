'use client'

import Link from 'next/link'
import { User } from '@supabase/supabase-js'

interface AdminHeaderProps {
    user: User | null
    handleLogout: () => Promise<void>
}

export default function AdminHeader({ user, handleLogout }: AdminHeaderProps) {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/admin/dashboard">
                            <span className="text-2xl font-bold text-white">SHOGUN TRADE 管理画面</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-white">{user?.email || 'Admin'}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
} 