'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useAuth() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return { handleLogout }
} 