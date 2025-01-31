"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // クライアントサイドでのみセッションをチェック
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user || null)
            } catch (error) {
                console.error('Error checking auth session:', error)
            } finally {
                setLoading(false)
            }
        }

        checkSession()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
} 