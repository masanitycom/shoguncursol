'use client'

import React, { memo } from 'react'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: Error | null;
    handleLogin: (email: string, password: string) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleSignUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

function AuthProviderComponent({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
                setIsAuthenticated(!!session)
            } catch (error) {
                setError(error as Error)
            } finally {
                setLoading(false)
            }
        }

        checkUser()

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            handleAuthStateChange(event, session)
        })

        return () => {
            authListener?.subscription.unsubscribe()
        }
    }, [])

    const handleAuthStateChange = (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', {
            event,
            isAuthenticated: !!session
        })
        
        setUser(session?.user || null)
        setIsAuthenticated(!!session)
    }

    const handleLogin = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
        } catch (error) {
            setError(error as Error)
            throw error
        }
    }

    const handleLogout = async () => {
        try {
            // 現在のページ情報とユーザー情報を保存
            const currentPath = window.location.pathname
            const { data: { session } } = await supabase.auth.getSession()
            const isAdmin = session?.user?.email?.endsWith('@admin.com')

            // リダイレクト先を決定
            const redirectPath = isAdmin ? '/admin/login' : '/login'

            // セッションをクリア
            await supabase.auth.signOut()
            
            // リダイレクト
            window.location.href = redirectPath
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const handleSignUp = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) throw error
        } catch (error) {
            setError(error as Error)
            throw error
        }
    }

    return React.createElement(AuthContext.Provider, {
        value: {
            user,
            loading,
            error,
            handleLogin,
            handleLogout,
            handleSignUp
        },
        children
    })
}

export const AuthProvider = memo(AuthProviderComponent)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export { AuthContext } 