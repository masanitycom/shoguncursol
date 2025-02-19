export interface Task {
    id: string;
    description: string;
    option1: string;
    option2: string;
    option3?: string;
    option4?: string;
    correct_option: number;
    created_at: string;
}

export interface TaskResponse {
    id: string;
    user_id: string;
    task_id: string;
    selected_option: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    task: Task;
    user: {
        email: string;
    };
}

export interface TaskWithResponses extends Task {
    responses: TaskResponse[];
}

// タスクの状態を管理するための型
export type TaskStatus = 'pending' | 'approved' | 'rejected';

// タスク作成時のリクエストボディの型
export interface CreateTaskRequest {
    description: string;
    option1: string;
    option2: string;
    option3?: string;
    option4?: string;
    correct_option: number;
}

// タスク回答時のリクエストボディの型
export interface SubmitTaskResponseRequest {
    task_id: string;
    selected_option: number;
} 