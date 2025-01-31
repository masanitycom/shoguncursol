'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SignUpCompletePage() {
    const router = useRouter()

    // 5秒後にログインページに自動遷移
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/login')
        }, 5000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <CheckCircleIcon className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    登録が完了しました
                </h2>
                <div className="mt-4 text-center text-gray-400">
                    <p>ご登録いただいたメールアドレスに確認メールを送信しました。</p>
                    <p>メール内のリンクをクリックして、登録を完了してください。</p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-4">
                        <p className="text-center text-gray-300">
                            5秒後にログインページに自動的に移動します
                        </p>
                        <div className="flex justify-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                ログインページへ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 