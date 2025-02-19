'use client'

import React, { memo } from 'react'
import { useContext, useEffect, useState, type ReactNode } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from './supabase'

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

    // 認証状態の変更を監視
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
            console.log('Auth state changed:', { event, session })

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setIsAuthenticated(false)
                
                // 現在のパスを確認して適切なリダイレクト先を決定
                const currentPath = window.location.pathname
                const redirectPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login'
                
                // 強制的にページ遷移
                window.location.replace(redirectPath)
                return
            }

            setUser(session?.user || null)
            setIsAuthenticated(!!session)
        })

        return () => {
            authListener?.subscription.unsubscribe()
        }
    }, [])

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
            // 現在のパスを保存
            const currentPath = window.location.pathname
            const redirectPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login'

            // セッションをクリア
            await supabase.auth.signOut()
            
            // リダイレクトはhandleAuthStateChangeで処理されるため、ここでは何もしない
        } catch (error) {
            console.error('Logout error:', error)
            // エラー時のみ直接リダイレクト
            const currentPath = window.location.pathname
            const redirectPath = currentPath.startsWith('/admin') ? '/admin/login' : '/login'
            window.location.replace(redirectPath)
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