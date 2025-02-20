'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    HomeIcon,
    UsersIcon,
    UserPlusIcon,
    ChartBarIcon,
    DocumentChartBarIcon,
    Cog6ToothIcon,
    ClipboardDocumentListIcon,
    PhotoIcon,
    WrenchScrewdriverIcon,
    ChevronDownIcon,
    BanknotesIcon,
    ChatBubbleLeftIcon,
    ShoppingCartIcon,
    PlusCircleIcon,
    TrophyIcon
} from '@heroicons/react/24/outline'
import { ListBulletIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

const menuGroups = [
    {
        title: 'メイン',
        items: [
            { name: 'ダッシュボード', href: '/admin/dashboard', icon: HomeIcon }
        ]
    },
    {
        title: 'ユーザー管理',
        items: [
            { name: 'ユーザー管理', href: '/admin/users', icon: UsersIcon },
            { name: '新規ユーザー登録', href: '/admin/users/new', icon: UserPlusIcon },
            { name: '組織図', href: '/admin/organization', icon: DocumentChartBarIcon }
        ]
    },
    {
        title: '収益管理',
        items: [
            { name: '報酬計算', href: '/admin/rewards/calculate', icon: ChartBarIcon },
            { name: '日利設定', href: '/admin/daily-rates', icon: ChartBarIcon },
            { name: '報酬管理', href: '/admin/rewards/manage', icon: BanknotesIcon },
            { name: '週次利益登録', href: '/admin/weekly-profits/register', icon: PlusCircleIcon },
            { name: '週次利益管理', href: '/admin/weekly-profits/manage', icon: ListBulletIcon },
            { name: '天下統一ボーナス', href: '/admin/conquest-bonus', icon: TrophyIcon }
        ]
    },
    {
        title: 'タスク',
        items: [
            { name: 'タスク管理', href: '/admin/tasks', icon: ClipboardDocumentListIcon },
            { name: '未回答タスク', href: '/admin/tasks/pending', icon: ClipboardDocumentListIcon }
        ]
    },
    {
        title: 'NFT',
        items: [
            { name: 'NFT管理', href: '/admin/nfts', icon: PhotoIcon },
            { name: 'NFT設定', href: '/admin/nfts/settings', icon: WrenchScrewdriverIcon }
        ]
    },
    {
        title: '設定',
        items: [
            { name: 'システム設定', href: '/admin/settings', icon: Cog6ToothIcon }
        ]
    }
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [openGroups, setOpenGroups] = useState<string[]>(menuGroups.map(g => g.title))
    const [purchaseRequestCount, setPurchaseRequestCount] = useState(0)

    const isActive = (path: string) => {
        return pathname === path ? 'bg-gray-800' : ''
    }

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => 
            prev.includes(title)
                ? prev.filter(g => g !== title)
                : [...prev, title]
        )
    }

    useEffect(() => {
        const fetchPurchaseRequests = async () => {
            const { count, error } = await supabase
                .from('nft_purchase_requests')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')

            if (!error && count !== null) {
                setPurchaseRequestCount(count)
            }
        }

        fetchPurchaseRequests()
        
        // リアルタイム更新をセットアップ
        const subscription = supabase
            .channel('purchase_requests')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'nft_purchase_requests'
            }, () => {
                fetchPurchaseRequests()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return (
        <aside className="bg-gray-900 w-64 min-h-screen px-4 py-8">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-white px-4">管理パネル</h2>
            </div>
            <nav>
                <ul className="space-y-4">
                    {menuGroups.map((group) => (
                        <li key={group.title} className="space-y-2">
                            <div
                                className="flex items-center justify-between px-4 py-2 text-gray-400 cursor-pointer hover:text-gray-300"
                                onClick={() => toggleGroup(group.title)}
                            >
                                <span className="text-sm font-semibold">{group.title}</span>
                                <ChevronDownIcon
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                        openGroups.includes(group.title) ? 'transform rotate-180' : ''
                                    }`}
                                />
                            </div>
                            {openGroups.includes(group.title) && (
                                <ul className="space-y-1 ml-4">
                                    {group.items.map((item) => (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg ${isActive(item.href)}`}
                                            >
                                                <item.icon className="h-5 w-5 mr-3" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    )
} 