'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import { TreeChart } from './components/TreeChart'
import { Member } from '@/app/types/organization'

export default function OrganizationPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [organizationData, setOrganizationData] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/organization')
                if (!response.ok) {
                    throw new Error('Failed to fetch organization data')
                }
                const data = await response.json()
                console.log('Fetched organization data:', data)
                setOrganizationData(data)
            } catch (err) {
                console.error('Error fetching organization:', err)
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        fetchOrganization()
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header user={null} onLogout={handleLogout} />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-white mb-8">組織図</h1>
                <div className="min-w-max">
                    {organizationData.length > 0 ? (
                        organizationData.map((member) => (
                            <TreeChart key={member.id} member={member} />
                        ))
                    ) : (
                        <div className="text-center text-gray-400">
                            データがありません
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
} 