'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Header from '../../../components/Header'
import AdminSidebar from '../../../components/AdminSidebar'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface NFT {
    id: string
    name: string
    price: number
    daily_rate: number
    image_url: string | null
    created_at: string
}

export default function NFTManagementPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [nfts, setNfts] = useState<NFT[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
        fetchNFTs()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchNFTs = async () => {
        try {
            const { data, error } = await supabase
                .from('nft_master')
                .select('*')
                .order('price', { ascending: true })

            if (error) throw error
            setNfts(data || [])
        } catch (error: any) {
            console.error('Error fetching NFTs:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('このNFTを削除してもよろしいですか？')) return

        try {
            const { error } = await supabase
                .from('nft_master')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchNFTs()
        } catch (error: any) {
            console.error('Error deleting NFT:', error)
            setError(error.message)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={user} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-medium text-white">NFT管理</h3>
                            <button
                                onClick={() => router.push('/admin/nfts/new')}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                新規NFT登録
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="px-6 py-3 text-left text-white">NFT名</th>
                                        <th className="px-6 py-3 text-left text-white">価格（USDT）</th>
                                        <th className="px-6 py-3 text-left text-white">日利上限（%）</th>
                                        <th className="px-6 py-3 text-left text-white">画像</th>
                                        <th className="px-6 py-3 text-left text-white">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {nfts.map((nft) => (
                                        <tr key={nft.id} className="hover:bg-gray-750">
                                            <td className="px-6 py-4 text-white">
                                                {nft.name}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                ${nft.price.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-white">
                                                {(nft.daily_rate * 100).toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4">
                                                {nft.image_url && (
                                                    <img
                                                        src={nft.image_url}
                                                        alt={nft.name}
                                                        className="w-16 h-16 object-cover rounded"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => router.push(`/admin/nfts/${nft.id}/edit`)}
                                                    className="text-blue-500 hover:text-blue-400 mr-3"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(nft.id)}
                                                    className="text-red-500 hover:text-red-400"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {nfts.length === 0 && !loading && (
                                <div className="text-center py-8 text-gray-400">
                                    NFTが登録されていません
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 