'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Header from '../../../../components/Header'
import AdminSidebar from '../../../../components/AdminSidebar'

interface PaymentInfo {
    bank_name?: string
    branch_name?: string
    account_type?: string
    account_number?: string
    account_holder?: string
    wallet_address?: string
    network?: string
}

interface PurchaseMessage {
    id: string
    type: 'bank_transfer' | 'usdt'
    title: string
    message: string
    payment_info: PaymentInfo
}

export default function PurchaseMessagesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [messages, setMessages] = useState<PurchaseMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        checkAuth()
        fetchMessages()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_messages')
                .select('*')
                .order('type')

            if (error) throw error
            setMessages(data)
        } catch (error: any) {
            console.error('Error fetching messages:', error)
            setError(error.message)
        }
    }

    const handleSubmit = async (message: PurchaseMessage) => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('purchase_messages')
                .update({
                    title: message.title,
                    message: message.message,
                    payment_info: message.payment_info,
                    updated_at: new Date().toISOString()
                })
                .eq('id', message.id)

            if (error) throw error

            setSuccess('メッセージを更新しました')
            fetchMessages()
        } catch (error: any) {
            console.error('Error updating message:', error)
            setError(error.message)
        } finally {
            setLoading(false)
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
                        <h3 className="text-3xl font-medium text-white mb-8">購入メッセージ設定</h3>

                        {error && (
                            <div className="mb-4 text-red-500">{error}</div>
                        )}

                        {success && (
                            <div className="mb-4 text-green-500">{success}</div>
                        )}

                        <div className="space-y-8">
                            {messages.map((message) => (
                                <div key={message.id} className="bg-gray-800 p-6 rounded-lg">
                                    <h4 className="text-xl font-medium text-white mb-4">
                                        {message.type === 'bank_transfer' ? '銀行振込' : 'USDT送金'}
                                    </h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-gray-300 mb-2">メール件名</label>
                                            <input
                                                type="text"
                                                value={message.title}
                                                onChange={(e) => setMessages(prev =>
                                                    prev.map(m =>
                                                        m.id === message.id
                                                            ? { ...m, title: e.target.value }
                                                            : m
                                                    )
                                                )}
                                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 mb-2">メッセージ本文</label>
                                            <textarea
                                                value={message.message}
                                                onChange={(e) => setMessages(prev =>
                                                    prev.map(m =>
                                                        m.id === message.id
                                                            ? { ...m, message: e.target.value }
                                                            : m
                                                    )
                                                )}
                                                rows={4}
                                                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                            />
                                        </div>

                                        {message.type === 'bank_transfer' ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-300 mb-2">銀行名</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.bank_name || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            bank_name: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">支店名</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.branch_name || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            branch_name: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">口座種別</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.account_type || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            account_type: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">口座番号</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.account_number || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            account_number: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">口座名義</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.account_holder || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            account_holder: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-gray-300 mb-2">ウォレットアドレス</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.wallet_address || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            wallet_address: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-300 mb-2">ネットワーク</label>
                                                    <input
                                                        type="text"
                                                        value={message.payment_info.network || ''}
                                                        onChange={(e) => setMessages(prev =>
                                                            prev.map(m =>
                                                                m.id === message.id
                                                                    ? {
                                                                        ...m,
                                                                        payment_info: {
                                                                            ...m.payment_info,
                                                                            network: e.target.value
                                                                        }
                                                                    }
                                                                    : m
                                                            )
                                                        )}
                                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleSubmit(message)}
                                            disabled={loading}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {loading ? '更新中...' : '更新する'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 