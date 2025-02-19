'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthContext, AuthContextType } from '@/lib/auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const router = useRouter()

    // ログイン処理
    const handleLogin = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            router.push('/dashboard')
        } catch (error) {
            setError(error as Error)
        }
    }

    // ログアウト処理
    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            router.push('/login')
        } catch (error) {
            setError(error as Error)
        }
    }

    // サインアップ処理
    const handleSignUp = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) throw error
            router.push('/dashboard')
        } catch (error) {
            setError(error as Error)
        }
    }

    // セッション監視
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    const value: AuthContextType = {
        user,
        loading,
        error,
        handleLogin,
        handleLogout,
        handleSignUp,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
} 