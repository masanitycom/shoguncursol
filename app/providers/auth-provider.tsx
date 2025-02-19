'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 認証コンテキストの型定義
type AuthContextType = {
    user: User | null;
    loading: boolean;
    handleLogout: () => Promise<void>;
}

// コンテキストの作成
const AuthContext = createContext<AuthContextType | null>(null)

// AuthProviderコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        checkUser()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const checkUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        } catch (error) {
            console.error('Error checking auth:', error)
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
            router.push('/login')
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, handleLogout }}>
            {children}
        </AuthContext.Provider>
    )
}

// useAuthフック
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
} 