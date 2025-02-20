'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateDisplayId } from '@/lib/utils/generateDisplayId'

interface RegisterFormData {
    email: string;
    password: string;
    referralCode?: string;
}

// レベル要件の定義
const LEVEL_REQUIREMENTS = {
    SHOGUN: {
        nft: 3000,
        referrer: 'SAMURAI',
        referrerNft: 3000
    },
    SAMURAI: {
        nft: 3000,
        referrer: null,
        referrerNft: 3000
    }
};

export default function RegisterPage() {
    const [formData, setFormData] = useState<RegisterFormData>({
        email: '',
        password: '',
        referralCode: ''
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // 1. ユーザー認証
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('User data is missing');

            // 2. display_idを生成（重複チェック込み）
            const displayId = await generateDisplayId();

            // 3. 紹介コードの検証（存在する場合）
            let referrerId = null;
            if (formData.referralCode) {
                referrerId = await verifyReferralCode(formData.referralCode);
            }

            // 4. プロフィールの作成
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    display_id: displayId,
                    email: formData.email,
                    name: formData.email.split('@')[0],
                    referrer_id: referrerId,
                    status: 'active'
                }]);

            if (profileError) throw profileError;

            // 成功時の処理
            window.location.href = '/dashboard';

        } catch (error) {
            console.error('Registration error:', error);
            // エラー処理
        }
    };

    // ... 残りのコンポーネントコード
}

const verifyReferralCode = async (referralCode: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_id', referralCode)
        .single();

    if (error || !data) {
        throw new Error('Invalid referral code');
    }

    return data.id;
}; 