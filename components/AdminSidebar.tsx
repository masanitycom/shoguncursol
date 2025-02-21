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
    TrophyIcon,
    CalculatorIcon
} from '@heroicons/react/24/outline'
import { ListBulletIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

const navigation = [
    {
        name: 'メイン',
        children: [
            { name: 'ダッシュボード', href: '/admin/dashboard', icon: HomeIcon }
        ]
    },
    {
        name: 'ユーザー管理',
        children: [
            { name: 'ユーザー管理', href: '/admin/users', icon: UsersIcon },
            { name: '新規ユーザー登録', href: '/admin/users/register', icon: UserPlusIcon },
            { name: '組織図', href: '/admin/organization', icon: UsersIcon }
        ]
    },
    {
        name: '収益管理',
        children: [
            { name: '報酬計算', href: '/admin/rewards/calculate', icon: CalculatorIcon },
            { name: '日利設定', href: '/admin/daily-rates', icon: ChartBarIcon },
            { name: '報酬管理', href: '/admin/rewards/manage', icon: BanknotesIcon }
        ]
    },
    {
        name: '天下統一ボーナス',
        children: [
            { name: 'ボーナス計算', href: '/admin/weekly-profits/register', icon: CalculatorIcon },
            { name: 'ボーナス管理', href: '/admin/weekly-profits/manage', icon: ListBulletIcon },
            { name: '到達状況', href: '/admin/conquest-progress', icon: ChartBarIcon }
        ]
    },
    {
        name: 'タスク',
        children: [
            { name: 'タスク管理', href: '/admin/tasks', icon: ClipboardDocumentListIcon },
            { name: '未回答タスク', href: '/admin/tasks/pending', icon: ClipboardDocumentListIcon }
        ]
    },
    {
        name: 'NFT',
        children: [
            { name: 'NFT管理', href: '/admin/nfts', icon: PhotoIcon },
            { name: 'NFT設定', href: '/admin/nfts/settings', icon: WrenchScrewdriverIcon }
        ]
    },
    {
        name: '設定',
        children: [
            { name: 'システム設定', href: '/admin/settings', icon: Cog6ToothIcon }
        ]
    }
]

export default function AdminSidebar() {
    const pathname = usePathname()
    const [openGroups, setOpenGroups] = useState<string[]>(navigation.map(g => g.name))
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
                    {navigation.map((group) => (
                        <li key={group.name} className="space-y-2">
                            <div
                                className="flex items-center justify-between px-4 py-2 text-gray-400 cursor-pointer hover:text-gray-300"
                                onClick={() => toggleGroup(group.name)}
                            >
                                <span className="text-sm font-semibold">{group.name}</span>
                                <ChevronDownIcon
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                        openGroups.includes(group.name) ? 'transform rotate-180' : ''
                                    }`}
                                />
                            </div>
                            {openGroups.includes(group.name) && (
                                <ul className="space-y-1 ml-4">
                                    {group.children.map((item) => (
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