export class UserService {
    static async resetPasswordTo000000(userId: string) {
        try {
            const { error } = await supabase.auth.admin.updateUserById(
                userId,
                { password: '000000' }
            );

            if (error) throw error;
            return { success: true };

        } catch (error) {
            console.error('パスワードリセットエラー:', error);
            return { success: false, error };
        }
    }
} 