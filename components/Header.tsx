'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface HeaderProps {
    user: User | null;
    onLogout: () => Promise<void>;
    profile?: {
        name?: string | null;
        email: string;
    };
    isAdmin?: boolean;
}

export default function Header({ user, profile, onLogout, isAdmin }: HeaderProps) {
    const router = useRouter()

    // display_nameがある場合はそれを、なければemailを表示
    const displayName = profile?.name || user?.email || 'ユーザー';

    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'}>
                            <span className="text-2xl font-bold text-white">SHOGUN TRADE</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-white">{displayName}</span>
                        <button
                            onClick={onLogout}
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