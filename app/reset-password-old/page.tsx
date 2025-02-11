'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CustomLocation extends Location {
    origin: string;
    pathname: string;
    search: string;
    hash: string;
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    ancestorOrigins: DOMStringList;
    assign(url: string | URL): void;
    reload(forcedReload?: boolean): void;
    replace(url: string | URL): void;
}

declare const window: Window & {
    location: CustomLocation;
};

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (typeof window === 'undefined') return;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`
            });

            if (error) throw error;
            setSuccess(true);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg">
                <h1 className="text-2xl text-white mb-6">パスワードリセット</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="メールアドレス"
                        className="w-full p-2 rounded mb-4"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded"
                    >
                        リセットメールを送信
                    </button>
                </form>
                {loading && (
                    <p className="mt-4 text-center text-white">処理中...</p>
                )}
                {error && (
                    <p className="mt-4 text-center text-red-500">{error}</p>
                )}
                {success && (
                    <p className="mt-4 text-center text-white">パスワードリセットのメールを送信しました</p>
                )}
            </div>
        </div>
    );
} 