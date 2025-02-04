'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'

interface Task {
    id: string
    description: string
    option1: string
    option2: string
    option3: string
    option4: string
    status: 'active' | 'inactive'
    created_at: string
    responses?: TaskResponse[]
}

interface TaskResponse {
    id: string
    selected_option: number
    status: 'pending' | 'approved' | 'rejected'
    user: {
        email: string
    }
    created_at: string
}

export default function TasksPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showNewTaskModal, setShowNewTaskModal] = useState(false)
    const [newTask, setNewTask] = useState({
        description: '',
        option1: '',
        option2: '',
        option3: '',
        option4: 'その他'
    })

    useEffect(() => {
        checkAuth()
        fetchTasks()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchTasks = async () => {
        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTasks(tasks)
        } catch (error: any) {
            console.error('Error fetching tasks:', error)
            setError(error.message)
        }
    }

    const handleCreateTask = async () => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('tasks')
                .insert([{
                    description: newTask.description,
                    option1: newTask.option1,
                    option2: newTask.option2,
                    option3: newTask.option3,
                    option4: newTask.option4
                }])

            if (error) throw error

            setSuccess('タスクを作成しました')
            setNewTask({
                description: '',
                option1: '',
                option2: '',
                option3: '',
                option4: 'その他'
            })
            fetchTasks()
        } catch (error: any) {
            console.error('Error creating task:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleTaskStatus = async (taskId: string, currentStatus: 'active' | 'inactive') => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: currentStatus === 'active' ? 'inactive' : 'active' })
                .eq('id', taskId)

            if (error) throw error

            setSuccess('タスクのステータスを更新しました')
            fetchTasks()
        } catch (error: any) {
            console.error('Error updating task:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateResponseStatus = async (responseId: string, status: 'approved' | 'rejected') => {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const { error } = await supabase
                .from('task_responses')
                .update({ status })
                .eq('id', responseId)

            if (error) throw error

            setSuccess('回答のステータスを更新しました')
            fetchTasks()
        } catch (error: any) {
            console.error('Error updating response:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-900">
            <Header 
                user={user} 
                isAdmin={true} 
                onLogout={handleLogout}
            />
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        <h3 className="text-3xl font-medium text-white mb-8">タスク管理</h3>

                        {/* 新規タスク作成フォーム */}
                        <div className="bg-white p-6 rounded-lg mb-8">
                            <h4 className="text-xl font-medium mb-4">新規タスク作成</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 mb-2">質問</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="タスクの質問を入力してください"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2">選択肢</label>
                                    <input
                                        type="text"
                                        value={newTask.option1}
                                        onChange={(e) => setNewTask({ ...newTask, option1: e.target.value })}
                                        className="w-full border rounded px-3 py-2 mb-2"
                                        placeholder="選択肢1"
                                    />
                                    <input
                                        type="text"
                                        value={newTask.option2}
                                        onChange={(e) => setNewTask({ ...newTask, option2: e.target.value })}
                                        className="w-full border rounded px-3 py-2 mb-2"
                                        placeholder="選択肢2"
                                    />
                                    <input
                                        type="text"
                                        value={newTask.option3}
                                        onChange={(e) => setNewTask({ ...newTask, option3: e.target.value })}
                                        className="w-full border rounded px-3 py-2 mb-2"
                                        placeholder="選択肢3"
                                    />
                                    <input
                                        type="text"
                                        value={newTask.option4}
                                        disabled
                                        className="w-full border rounded px-3 py-2 opacity-50"
                                        placeholder="その他"
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={handleCreateTask}
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        タスクを登録
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* タスク一覧 */}
                        <div className="bg-white rounded-lg overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">質問</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">選択肢</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {tasks.map(task => (
                                        <tr key={task.id}>
                                            <td className="px-6 py-4">{task.description}</td>
                                            <td className="px-6 py-4">
                                                <div>{task.option1}</div>
                                                <div>{task.option2}</div>
                                                <div>{task.option3}</div>
                                                <div>{task.option4}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                                    className={`px-3 py-1 rounded ${
                                                        task.status === 'active' 
                                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                    }`}
                                                >
                                                    {task.status === 'active' ? '削除' : '有効化'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
} 