interface HeaderProps {
    user: any;
    onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
    return (
        <header className="bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    <div className="text-white font-bold text-xl">Shogun Trade</div>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300">{user?.email}</span>
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                ログアウト
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
} 