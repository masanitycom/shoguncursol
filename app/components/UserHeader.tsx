const handleLogout = async () => {
    try {
        await supabase.auth.signOut()
        router.push('/login')  // 一般ユーザー用のログインページにリダイレクト
        router.refresh()  // ページをリフレッシュ
    } catch (error) {
        console.error('Logout error:', error)
    }
} 