import React, { useState } from 'react';
import { PurchaseRequest } from '@/types/nftPurchaseRequest';
import { message as antMessage } from 'antd';

interface EditRequestFormProps {
    request: PurchaseRequest;
    onSubmit: (data: PurchaseRequest) => Promise<void>;
    onCancel: () => void;
}

export default function EditRequestForm({ request, onSubmit, onCancel }: EditRequestFormProps) {
    const [formData, setFormData] = useState<PurchaseRequest>(() => ({
        id: request.id,
        user_id: request.user_id,
        nft_id: request.nft_id,
        status: request.status,
        created_at: request.created_at,
        approved_at: request.approved_at || null,
        rejected_at: request.rejected_at || null,
        rejection_reason: request.rejection_reason || null,
        payment_method: request.payment_method,
        price: request.price || null,
        user: request.user,
        nft: request.nft
    }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            antMessage.success('リクエストを更新しました');
        } catch (error) {
            console.error('Error updating request:', error);
            antMessage.error('リクエストの更新に失敗しました');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: PurchaseRequest) => ({
            ...prev,
            [name]: value,
            ...(name === 'status' && value !== 'rejected' ? {
                rejection_reason: null,
                rejected_at: null
            } : {})
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    ステータス
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="pending">保留中</option>
                        <option value="approved">承認済み</option>
                        <option value="rejected">却下</option>
                        <option value="deactivated">無効</option>
                    </select>
                </label>
            </div>

            {formData.status === 'rejected' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        却下理由
                        <input
                            type="text"
                            name="rejection_reason"
                            value={formData.rejection_reason || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </label>
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    キャンセル
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                    更新
                </button>
            </div>
        </form>
    );
} 