'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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

export default function SignUpForm({ defaultReferrerId }: Props = {}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        nameKana: '',
        userId: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        referrerId: defaultReferrerId || '',
        usdtAddress: '',
        walletType: 'EVOカード'
    })

    // バリデーションルールの定義
    const VALIDATION_PATTERNS = {
        nameKana: /^[ァ-ヶー0-9A-Za-z]+$/,  // カタカナと英数字のみ
        userId: /^[a-zA-Z0-9]{6,}$/,        // 半角英数6文字以上
        phone: /^[0-9]{10,11}$/,            // 数字10-11桁
        referrerId: /^[a-zA-Z0-9-]+$/,      // 半角英数とハイフンのみ
        usdtAddress: /^0x[a-fA-F0-9]{40}$/  // 0xで始まる16進数40文字
    }

    // エラーメッセージの定義
    const VALIDATION_MESSAGES = {
        nameKana: 'カタカナと英数字のみで入力してください（スペース不可）',
        userId: 'ユーザーIDは半角英数字6文字以上で入力してください',
        phone: '電話番号は10桁または11桁の数字で入力してください',
        referrerId: '紹介者IDは半角英数字とハイフンのみで入力してください',
        usdtAddress: '有効なBEP20のUSDTアドレスを入力してください'
    }

    // バリデーション状態の管理を修正
    const [validation, setValidation] = useState<ValidationState>({
        nameKana: { isValid: true, message: '', touched: false },
        userId: { isValid: true, message: '', touched: false },
        email: { isValid: true, message: '', touched: false },
        password: { isValid: true, message: '', touched: false },
        confirmPassword: { isValid: true, message: '', touched: false },
        phone: { isValid: true, message: '', touched: false },
        referrerId: { isValid: true, message: '', touched: false },
        usdtAddress: { isValid: true, message: '', touched: false },
        walletType: { isValid: true, message: '', touched: false }  // walletTypeを追加
    })

    // フィールドの検証を行う関数
    const validateField = (name: string, value: string) => {
        let isValid = true
        let message = ''

        switch (name) {
            case 'nameKana':
                isValid = VALIDATION_PATTERNS.nameKana.test(value)
                message = isValid ? '' : VALIDATION_MESSAGES.nameKana
                break
            case 'userId':
                isValid = VALIDATION_PATTERNS.userId.test(value)
                message = isValid ? '' : VALIDATION_MESSAGES.userId
                break
            case 'phone':
                isValid = VALIDATION_PATTERNS.phone.test(value)
                message = isValid ? '' : VALIDATION_MESSAGES.phone
                break
            case 'referrerId':
                isValid = VALIDATION_PATTERNS.referrerId.test(value)
                message = isValid ? '' : VALIDATION_MESSAGES.referrerId
                break
            case 'usdtAddress':
                if (value) { // 任意項目なので、値がある場合のみ検証
                    isValid = VALIDATION_PATTERNS.usdtAddress.test(value)
                    message = isValid ? '' : VALIDATION_MESSAGES.usdtAddress
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
    }

    // 入力ハンドラーを更新
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        validateField(name, value)
    }

    // フィールドがフォーカスを失った時の処理
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        validateField(name, value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // カスタムバリデーション
        if (!validation.nameKana.isValid) {
            setError(validation.nameKana.message)
            return
        }
        if (!validation.userId.isValid) {
            setError(validation.userId.message)
            return
        }
        if (!validation.phone.isValid) {
            setError(validation.phone.message)
            return
        }
        if (!validation.referrerId.isValid) {
            setError(validation.referrerId.message)
            return
        }
        if (formData.usdtAddress && !validation.usdtAddress.isValid) {
            setError(validation.usdtAddress.message)
            return
        }

        setLoading(true)

        try {
            if (formData.password !== formData.confirmPassword) {
                throw new Error('パスワードが一致しません')
            }

            // Supabaseで新規ユーザー登録
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name_kana: formData.nameKana,
                        user_id: formData.userId,
                        phone: formData.phone,
                        referrer_id: formData.referrerId,
                        usdt_address: formData.usdtAddress,
                        wallet_type: formData.walletType
                    }
                }
            })

            if (authError) throw authError

            // ユーザープロフィールを作成
            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        name_kana: formData.nameKana,
                        user_id: formData.userId,
                        email: formData.email,
                        phone: formData.phone,
                        referrer_id: formData.referrerId,
                        usdt_address: formData.usdtAddress,
                        wallet_type: formData.walletType
                    }])

                if (profileError) throw profileError
            }

            router.push('/signup/complete')
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

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
                        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                            {error}
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
                                name="nameKana"
                                value={formData.nameKana}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                className={`${inputClassName} ${
                                    validation.nameKana.touched && !validation.nameKana.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.nameKana.touched && !validation.nameKana.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.nameKana.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                ユーザーID
                                <RequiredBadge />
                                <span className="text-xs text-gray-400 ml-2">半角英数字のみ</span>
                            </label>
                            <input
                                type="text"
                                name="userId"
                                value={formData.userId}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                pattern="^[a-zA-Z0-9]+$"
                                placeholder="例：user123"
                                className={`${inputClassName} ${
                                    validation.userId.touched && !validation.userId.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.userId.touched && !validation.userId.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.userId.message}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                name="referrerId"
                                value={formData.referrerId}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                required
                                pattern={VALIDATION_PATTERNS.referrerId.source}
                                disabled={!!defaultReferrerId}
                                placeholder="紹介者のIDを入力"
                                className={`${inputClassName} ${
                                    validation.referrerId.touched && !validation.referrerId.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.referrerId.touched && !validation.referrerId.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.referrerId.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                USDTアドレス（BEP20）
                                <OptionalBadge />
                            </label>
                            <input
                                type="text"
                                name="usdtAddress"
                                value={formData.usdtAddress}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                pattern={VALIDATION_PATTERNS.usdtAddress.source}
                                placeholder="0xで始まるBEP20のUSDTアドレス"
                                className={`${inputClassName} ${
                                    validation.usdtAddress.touched && !validation.usdtAddress.isValid 
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                    : ''
                                }`}
                            />
                            {validation.usdtAddress.touched && !validation.usdtAddress.isValid && (
                                <p className="mt-1 text-sm text-red-500">
                                    {validation.usdtAddress.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className={labelClassName}>
                                ウォレットの種類
                                <OptionalBadge />
                            </label>
                            <select
                                name="walletType"
                                value={formData.walletType}
                                onChange={handleInputChange}
                                onBlur={handleBlur}
                                className={inputClassName}  // バリデーション表示を削除（任意項目のため）
                            >
                                <option value="">選択してください</option>
                                <option value="EVOカード">EVOカード</option>
                                <option value="その他">その他のウォレット</option>
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