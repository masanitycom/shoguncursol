'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const AdminSidebar = () => {
    const pathname = usePathname()

    const menuItems = [
        { path: '/admin/dashboard', label: 'ダッシュボード' },
        { path: '/admin/users', label: 'ユーザー管理' },
        { path: '/admin/organization', label: '組織図' },
        { path: '/admin/rewards', label: '報酬管理' },
        { path: '/admin/rewards/manage', label: '報酬設定' },
        { path: '/admin/nfts', label: 'NFT管理' },
        { path: '/admin/tasks', label: 'タスク管理' },
        { path: '/admin/settings', label: '設定' }
    ]

    return (
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-gray-800 text-white p-4 shrink-0">
            <nav className="space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`
                            block px-4 py-2 rounded-lg transition-colors duration-200
                            ${pathname === item.path 
                                ? 'bg-gray-700 text-white' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                        `}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </aside>
    )
}

export default AdminSidebar 