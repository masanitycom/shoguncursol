'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function PurchaseCompletePage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            if (session.user.email === 'testadmin@gmail.com') {
                router.push('/admin/dashboard')
                return
            }

            setUser(session.user)
        } catch (error) {
            console.error('Error checking auth:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading || !user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                onLogout={handleLogout}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">購入申請完了</h1>
                    <p className="text-gray-300 mb-8">
                        NFTの購入申請を受け付けました。<br />
                        メールに記載された手順に従って支払いを完了してください。
                    </p>
                    <div className="space-y-4">
                        <Link
                            href="/dashboard"
                            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            ダッシュボードに戻る
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
} 