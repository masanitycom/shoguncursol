'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../providers/auth'
import { TaskResponse } from '@/types/task'
import { supabase } from '@/lib/supabase'

export default function PendingTasksPage() {
    const router = useRouter()
    const { user, loading } = useAuth()
    const [responses, setResponses] = useState<TaskResponse[]>([])
    const [pageLoading, setPageLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
            return
        }

        if (user) {
            fetchPendingTasks()
        }
    }, [user, loading, router])

    const fetchPendingTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('task_responses')
                .select(`
                    *,
                    task:tasks(*),
                    user:profiles(email)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) throw error
            setResponses(data)
        } catch (error: any) {
            console.error('Error fetching responses:', error)
            setError(error.message)
        } finally {
            setPageLoading(false)
        }
    }

    const handleUpdateStatus = async (responseId: string, status: 'approved' | 'rejected') => {
        setPageLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('task_responses')
                .update({ status })
                .eq('id', responseId)

            if (error) throw error

            setSuccess(`回答を${status === 'approved' ? '承認' : '却下'}しました`)
            fetchPendingTasks()
        } catch (error: any) {
            console.error('Error updating response:', error)
            setError(error.message)
        } finally {
            setPageLoading(false)
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">未承認の回答一覧</h1>
            
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                                    タスク内容
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                                    回答者
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                                    選択した回答
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {responses.map(response => (
                                <tr key={response.id}>
                                    <td className="px-6 py-4 text-white">
                                        {response.task.description}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {response.user.email}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {response.task[`option${response.selected_option}` as keyof typeof response.task]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleUpdateStatus(response.id, 'approved')}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                承認
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(response.id, 'rejected')}
                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                却下
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-600 text-white rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-4 p-4 bg-green-600 text-white rounded">
                    {success}
                </div>
            )}
        </div>
    )
}