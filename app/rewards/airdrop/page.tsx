'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'

interface Task {
    id: string
    description: string
    option1: string
    option2: string
    option3: string
    option4: string
    status: 'active' | 'inactive'
}

export default function AirdropPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [task, setTask] = useState<Task | null>(null)

    useEffect(() => {
        checkAuth()
        fetchRandomTask()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        setUser(session.user)
    }

    const fetchRandomTask = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('status', 'active')

            if (error) throw error
            if (!data || data.length === 0) {
                setError('本日のタスクはありません')
                return
            }

            // ランダムでタスクを選択
            const randomIndex = Math.floor(Math.random() * data.length)
            setTask(data[randomIndex])
        } catch (error: any) {
            console.error('Error fetching task:', error)
            setError('タスクの取得に失敗しました')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedOption === null) return

        setLoading(true)
        setError(null)

        try {
            // 選択肢のインデックスが0から3の範囲内であることを確認
            if (selectedOption < 0 || selectedOption > 3) {
                throw new Error('無効な選択肢です')
            }

            const { error } = await supabase
                .from('task_responses')
                .insert({
                    user_id: user.id,
                    task_id: task?.id,
                    selected_option: selectedOption
                })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        } catch (error: any) {
            console.error('Error submitting response:', error)
            setError('回答の送信に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    if (!user || !task) return null

    const options = [
        task.option1,
        task.option2,
        task.option3,
        task.option4
    ]

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                onLogout={handleLogout}
            />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-bold text-white mb-8">
                        エアドロタスク
                    </h1>

                    {error && (
                        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded text-green-200">
                                エアドロップを受け取りました！
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-medium text-white mb-4">
                                        {task.description}
                                    </h2>
                                    <div className="space-y-4">
                                        {options.map((option, index) => (
                                            <label
                                                key={index}
                                                className={`block p-4 rounded-lg border cursor-pointer
                                                    ${selectedOption === index
                                                        ? 'bg-blue-600/50 border-blue-500'
                                                        : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="task-option"
                                                    value={index}
                                                    checked={selectedOption === index}
                                                    onChange={() => setSelectedOption(index)}
                                                    className="sr-only"
                                                />
                                                <span className="text-white">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || selectedOption === null}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg
                                        transition-colors duration-200 disabled:opacity-50"
                                >
                                    {loading ? '処理中...' : 'エアドロップを受け取る'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    )
} 