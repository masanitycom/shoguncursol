import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 型定義を明確に
type HeaderProps = {
    user: any;
    isAdmin?: boolean;
    onLogout?: () => void;  // オプショナルであることを明確に
}

export default function Header({ user, isAdmin = false, onLogout }: HeaderProps) {
    const router = useRouter()
    
    const defaultLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleLogout = onLogout || defaultLogout

    return (
        <header className="bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    <div className="text-white font-bold text-xl">
                        {isAdmin ? 'Shogun Trade Admin' : 'Shogun Trade'}
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">{user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
} 