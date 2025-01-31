import { supabase } from '../lib/supabase';
import { createHash } from 'crypto';
import { User } from '@supabase/supabase-js';

interface OldUser {
    id: string;
    email: string;
    referrer_id: string | null;
    created_at: string;
}

async function migrateUsers(oldUsers: OldUser[]) {
    for (const user of oldUsers) {
        try {
            // 1. 一時的なパスワードを生成（例：メールアドレスのハッシュ）
            const tempPassword = createHash('md5')
                .update(user.email)
                .digest('hex')
                .slice(0, 12);

            // 2. Auth.usersテーブルにユーザーを作成
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    migrated: true,
                    old_id: user.id
                }
            });

            if (authError) throw authError;

            // 3. プロフィールテーブルを更新
            await supabase.from('profiles').update({
                id: user.id,  // 古いIDを維持
                referrer_id: user.referrer_id,
                needs_password_reset: true  // パスワードリセットが必要なフラグ
            }).eq('id', authUser.user.id);

            console.log(`Migrated user: ${user.email}`);

        } catch (error) {
            console.error(`Error migrating user ${user.email}:`, error);
        }
    }
} 