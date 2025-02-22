// 管理者用のユーザー登録API
export async function POST(request: Request) {
    try {
        const userData: NewUserData = await request.json();
        console.log('Admin creating user:', userData);

        // 管理者権限チェック（実装が必要）

        // 以下は既存のコードと同じ
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true
        });
        // ...
    }
} 