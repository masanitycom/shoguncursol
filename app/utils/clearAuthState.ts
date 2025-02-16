export const clearAuthState = () => {
    if (typeof window === 'undefined') return;

    try {
        // ローカルストレージのクリア
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
        
        // その他のSupabase関連のストレージもクリア
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.auth.')) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Failed to clear auth state:', error);
    }
}; 