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
        { path: '/admin/daily-rates', label: 'レート管理' },
        { path: '/admin/tasks', label: 'タスク管理' },
        { path: '/admin/nfts', label: 'NFT管理' },
        { path: '/admin/nfts/settings', label: 'NFT設定' },
        { path: '/admin/settings', label: 'システム設定' },
    ]

    return (
        <aside className="w-64 bg-gray-800 min-h-screen">
            <nav className="mt-5">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`
                            block px-4 py-2 my-1 mx-2 rounded
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