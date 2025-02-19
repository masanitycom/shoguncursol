'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface UserHeaderProps {
    user: User | null;
    onLogout: () => Promise<void>;
}

export default function UserHeader({ user, onLogout }: UserHeaderProps) {
    return (
        <header className="bg-gray-800 py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/dashboard" className="text-white font-bold text-xl hover:text-gray-300">
                    SHOGUN TRADE
                </Link>
                <div className="flex items-center space-x-4">
                    <span className="text-white">{user?.email}</span>
                    <button
                        onClick={onLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                        ログアウト
                    </button>
                </div>
            </div>
        </header>
    )
} 