'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import AdminSidebar from '../../../components/AdminSidebar'
import Header from '@/components/Header'

export default function AdminSettingsPage() {
    const [paymentMessage, setPaymentMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'payment_message')
                .single()

            if (error) throw error
            if (data) {
                setPaymentMessage(data.value)
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error)
            setError('設定の取得に失敗しました')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('system_settings')
                .update({ value: paymentMessage })
                .eq('key', 'payment_message')

            if (error) throw error
            setSuccess('設定を更新しました')
        } catch (error: any) {
            console.error('Error updating settings:', error)
            setError('設定の更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={null} isAdmin={true} />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">システム設定</h1>
                    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4">支払い情報メッセージ</h2>
                            <div className="mb-6">
                                <textarea
                                    value={paymentMessage}
                                    onChange={(e) => setPaymentMessage(e.target.value)}
                                    className="w-full h-64 border rounded px-3 py-2"
                                    placeholder="支払い情報のメッセージを入力してください"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '更新中...' : '設定を更新'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
} 