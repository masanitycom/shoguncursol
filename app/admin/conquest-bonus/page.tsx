'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'

export default function ConquestBonusPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-900">
            <Header />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-8">
                    <h1 className="text-2xl font-bold text-white mb-6">天下統一ボーナス</h1>
                    {/* 実装予定 */}
                </main>
            </div>
        </div>
    )
} 