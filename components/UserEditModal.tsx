'use client'

import { useState } from 'react'

interface UserProfile {
    id: string
    name: string
    email: string
    wallet_type: string
    wallet_address: string
    active: boolean
    created_at: string
}

interface UserEditModalProps {
    user: UserProfile;
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: UserProfile & { password?: string }) => void;
}

export function UserEditModal({ user, onClose, onSave }: UserEditModalProps) {
    const [editedUser, setEditedUser] = useState(user)
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ ...editedUser, password })
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-xl">
                {/* ヘッダー部分 */}
                <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">ユーザー情報編集</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        ✕
                    </button>
                </div>

                {/* フォーム部分 */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* 基本情報セクション */}
                    <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">基本情報</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    名前
                                </label>
                                <input
                                    type="text"
                                    value={editedUser.name}
                                    onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                                    className="w-full bg-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    value={editedUser.email}
                                    onChange={e => setEditedUser({...editedUser, email: e.target.value})}
                                    className="w-full bg-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ウォレット情報セクション */}
                    <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">ウォレット情報</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    ウォレットタイプ
                                </label>
                                <select
                                    value={editedUser.wallet_type}
                                    onChange={e => setEditedUser({...editedUser, wallet_type: e.target.value})}
                                    className="w-full bg-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    <option value="EVO">EVO</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    ウォレットアドレス
                                </label>
                                <input
                                    type="text"
                                    value={editedUser.wallet_address}
                                    onChange={e => setEditedUser({...editedUser, wallet_address: e.target.value})}
                                    className="w-full bg-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* パスワード変更セクション */}
                    <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                        <h3 className="text-lg font-medium text-white mb-4">パスワード変更</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                新しいパスワード（変更する場合のみ）
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-gray-600 text-white rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="パスワードを入力"
                            />
                        </div>
                    </div>

                    {/* アカウント状態 */}
                    <div className="bg-gray-700 p-4 rounded-lg">
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={editedUser.active}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const checkbox = e.currentTarget as unknown as { checked: boolean };
                                    setEditedUser({...editedUser, active: checkbox.checked});
                                }}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="text-white">アカウントアクティブ</span>
                        </label>
                    </div>

                    {/* ボタン部分 */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 