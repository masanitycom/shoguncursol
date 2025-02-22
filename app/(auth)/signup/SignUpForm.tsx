'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ウォレットタイプの型を修正
type WalletType = 'EVO' | 'その他' | ''

interface SignUpFormData {
    name: string
    display_id: string
    email: string
    password: string
    confirmPassword: string
    phone: string
    referrer_id: string
    wallet_address?: string
    wallet_type?: WalletType
}

interface Props {
    defaultReferrerId?: string
}

// フォームの検証状態を管理するステートを追加
interface ValidationState {
    [key: string]: {
        isValid: boolean;
        message: string;
        touched: boolean;
    }
}

interface ValidationErrors {
    [key: string]: string;
}

// エラーメッセージの型を定義
interface ErrorMessages {
    [key: string]: string;
}

const ERROR_MESSAGES: ErrorMessages = {
    'required_fields_missing': '名前とユーザーIDは必須です',
    'display_id_exists': 'このユーザーIDは既に使用されています',
    'referrer_not_found': '指定された紹介者IDは存在しません',
    'weak_password': 'パスワードは8文字以上で、文字、数字、記号を含める必要があります',
    'passwords_not_match': 'パスワードが一致しません',
    'signup_failed': 'ユーザー登録に失敗しました',
    'profile_creation_failed': 'プロフィールの作成に失敗しました',
    'default': '登録中にエラーが発生しました。入力内容を確認して再度お試しください'
};

export default function SignUpForm({ defaultReferrerId }: Props = {}) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<SignUpFormData>({
        name: '',
        display_id: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        referrer_id: defaultReferrerId || '',
        wallet_address: '',
        wallet_type: ''
    })

    useEffect(() => {
        const refId = searchParams.get('ref')
        if (refId) {
            setFormData(prev => ({
                ...prev,
                referrer_id: refId
            }))
        }
    }, [searchParams])

    // バリデーションルールの修正
    const VALIDATION_PATTERNS = {
        name: /^[ァ-ヶー0-9A-Za-z]+$/,  // カタカナと英数字のみ
        display_id: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,  // 半角英数字混在で6文字以上
        phone: /^[0-9]{10,11}$/,            // 数字10-11桁
        referrer_id: /^[A-Za-z0-9]+$/,   // 半角英数字のみ（文字数制限なし）
        wallet_address: /^0x[a-fA-F0-9]{40}$/  // 0xで始まる16進数40文字
    }

    // バリデーション状態の管理を修正
    const [validation, setValidation] = useState<ValidationState>({
        name: { isValid: true, message: '', touched: false },
        display_id: { isValid: true, message: '', touched: false },
        email: { isValid: true, message: '', touched: false },
        password: { isValid: true, message: '', touched: false },
        confirmPassword: { isValid: true, message: '', touched: false },
        phone: { isValid: true, message: '', touched: false },
        referrer_id: { isValid: true, message: '', touched: false },
        wallet_address: { isValid: true, message: '', touched: false },
        wallet_type: { isValid: true, message: '', touched: false }  // wallet_typeを追加
    })

    // フィールドの検証を行う関数
    const validateField = useCallback((name: keyof SignUpFormData, value: string) => {
        let isValid = true
        let message = ''

        switch (name) {
            case 'name':
                isValid = VALIDATION_PATTERNS.name.test(value)
                message = isValid ? '' : 'カタカナと英数字のみで入力してください（スペース不可）'
                break
            case 'display_id':
                isValid = VALIDATION_PATTERNS.display_id.test(value)
                message = isValid ? '' : 'ユーザーIDは半角英数字を混ぜて6文字以上で入力してください'
                break
            case 'phone':
                isValid = VALIDATION_PATTERNS.phone.test(value)
                message = isValid ? '' : '電話番号は10桁または11桁の数字で入力してください'
                break
            case 'referrer_id':
                isValid = VALIDATION_PATTERNS.referrer_id.test(value)
                message = isValid ? '' : '紹介者IDは必須です。半角英数字で入力してください'
                break
            case 'wallet_address':
                if (value) {
                    isValid = VALIDATION_PATTERNS.wallet_address.test(value)
                    message = isValid ? '' : '有効なBEP20のUSDTアドレスを入力してください'
                }
                break
            case 'confirmPassword':
                isValid = value === formData.password
                message = isValid ? '' : 'パスワードが一致しません'
                break
        }

        setValidation(prev => ({
            ...prev,
            [name]: {
                isValid,
                message,
                touched: true
            }
        }))

        return isValid
    }, [formData.password])

    // 入力ハンドラーを更新
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement
        const name = target.name as keyof SignUpFormData
        const value = target.value
        setFormData(prev => ({ ...prev, [name]: value }))
        validateField(name, value)
    }

    // フィールドがフォーカスを失った時の処理
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement
        const name = target.name as keyof SignUpFormData
        const value = target.value
        validateField(name, value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // デバッグ用のログ追加
            console.log('Sending data:', {
                ...formData,
                hasPassword: !!formData.password,
                passwordLength: formData.password?.length
            });

            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,  // パスワードが正しく送信されているか確認
                    name: formData.name,
                    display_id: formData.display_id,
                    phone: formData.phone,
                    referrer_id: formData.referrer_id,
                    wallet_address: formData.wallet_address,
                    wallet_type: formData.wallet_type
                })
            });

            const data = await response.json();
            console.log('Response:', data);  // レスポンスの詳細を確認

            if (!response.ok) {
                throw new Error(data.error);
            }

            router.push('/signup/complete');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // フォームフィールドのスタイルを共通化
    const inputClassName = "mt-1 block w-full px-4 py-3 rounded-md border border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
    const labelClassName = "block text-sm font-medium text-gray-300"
    const requiredMark = <span className="text-red-500 ml-1">*</span>

    // 必須/任意バッジのコンポーネントを追加
    const RequiredBadge = () => (
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 rounded">
            必須
        </span>
    )

    const OptionalBadge = () => (
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-600 text-gray-400 rounded">
            任意
        </span>
    )

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-white">
                    新規アカウント登録
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">エラー: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <span className="text-red-500">*</span>
                            <span>は必須項目です</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className={labelClassName}>
                                お名前（カナ）
                                <RequiredBadge />
                                <span className="text-xs text-gray-400 ml-2">カタカナと英数字のみ（スペース不可）</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                className={`${inputClassName} ${
                                    validation.name.touched && !validation.name.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.name.touched && !validation.name.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                ユーザーID
                                <RequiredBadge />
                                <span className="text-xs text-gray-400 ml-2">半角英数字を混ぜて6文字以上</span>
                            </label>
                            <input
                                type="text"
                                name="display_id"
                                value={formData.display_id}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$"
                                placeholder="例：user123"
                                className={`${inputClassName} ${
                                    validation.display_id.touched && !validation.display_id.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.display_id.touched && !validation.display_id.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.display_id.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                メールアドレス
                                <RequiredBadge />
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                placeholder="example@email.com"
                                className={`${inputClassName} ${
                                    validation.email.touched && !validation.email.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.email.touched && !validation.email.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                パスワード
                                <RequiredBadge />
                                <span className="text-xs text-gray-400 ml-2">8文字以上</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                minLength={8}
                                placeholder="8文字以上で入力してください"
                                className={`${inputClassName} ${
                                    validation.password.touched && !validation.password.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.password.touched && !validation.password.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                パスワード（確認）
                                <RequiredBadge />
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                minLength={8}
                                placeholder="パスワードを再入力"
                                className={`${inputClassName} ${
                                    validation.confirmPassword.touched && !validation.confirmPassword.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.confirmPassword.touched && !validation.confirmPassword.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                電話番号
                                <RequiredBadge />
                                <span className="text-xs text-gray-400 ml-2">ハイフンなし</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                pattern="^[0-9]*$"
                                placeholder="例：09012345678"
                                className={`${inputClassName} ${
                                    validation.phone.touched && !validation.phone.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.phone.touched && !validation.phone.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.phone.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                紹介者ID
                                <RequiredBadge />
                            </label>
                            <input
                                type="text"
                                name="referrer_id"
                                value={formData.referrer_id}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                pattern={VALIDATION_PATTERNS.referrer_id.source}
                                className={`${inputClassName} ${
                                    validation.referrer_id.touched && !validation.referrer_id.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                                placeholder="紹介者のIDを入力（必須）"
                            />
                            {validation.referrer_id.touched && !validation.referrer_id.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.referrer_id.message}
                                </p>
                            )}
                            <p className="mt-1 text-sm text-gray-400">
                                紹介者のIDを入力してください
                            </p>
                        </div>

                        <div>
                            <label className={labelClassName}>
                                USDTアドレス（BEP20）
                                <OptionalBadge />
                            </label>
                            <input
                                type="text"
                                name="wallet_address"
                                value={formData.wallet_address}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                pattern={VALIDATION_PATTERNS.wallet_address.source}
                                placeholder="0xで始まるBEP20のUSDTアドレス"
                                className={`${inputClassName} ${
                                    validation.wallet_address.touched && !validation.wallet_address.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.wallet_address.touched && !validation.wallet_address.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.wallet_address.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                ウォレットの種類
                                <OptionalBadge />
                            </label>
                            <select
                                name="wallet_type"
                                value={formData.wallet_type}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={inputClassName}
                            >
                                <option value="">選択してください</option>
                                <option value="EVO">EVOカード</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? '登録中...' : '登録する'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 text-gray-400">
                                    すでにアカウントをお持ちの方は
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/login"
                                className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                ログイン
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 