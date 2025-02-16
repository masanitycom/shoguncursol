'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: (isAdmin?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    // セッションが切れた場合、現在のパスに基づいてリダイレクト
                    const path = window.location.pathname;
                    if (path.startsWith('/admin')) {
                        router.push('/admin/login');
                    } else {
                        router.push('/login');
                    }
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const signOut = async (isAdmin?: boolean) => {
        try {
            // セッションを完全に削除
            await supabase.auth.signOut()
            
            // ローカルストレージとセッションストレージをクリア
            if (typeof window !== 'undefined') {
                window.localStorage.clear()
                window.sessionStorage.clear()
            }

            // isAdminパラメータを優先
            const redirectPath = isAdmin 
                ? '/admin/login'  // 管理者の場合は必ず /admin/login へ
                : '/login'       // それ以外は /login へ
            
            // 強制的なページ遷移
            window.location.href = redirectPath
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider; 