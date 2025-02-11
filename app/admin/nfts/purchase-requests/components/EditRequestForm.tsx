import React, { useState } from 'react';
import { NFTPurchaseRequest } from '@/types/nftPurchaseRequest';
import { message as antMessage } from 'antd';

interface EditRequestFormProps {
    request: NFTPurchaseRequest;
    onSubmit: (data: NFTPurchaseRequest) => Promise<void>;
    onCancel: () => void;
}

export const EditRequestForm = ({ request, onSubmit, onCancel }: EditRequestFormProps) => {
    const [formData, setFormData] = useState({
        id: request.id,
        user_id: request.user_id,
        created_at: request.created_at,
        approved_at: request.approved_at,
        nft_id: request.nft_id,
        status: request.status,
        rejected_at: request.rejected_at,
        rejection_reason: request.rejection_reason,
        price: request.price,
        user: request.user,
        nft: request.nft
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // バリデーション
        if (!formData.created_at || !formData.nft_id || !formData.status) {
            antMessage.error('必須項目を入力してください');
            return;
        }

        try {
            // 型アサーションを使用して、formDataがNFTPurchaseRequestの要件を満たすことを保証
            onSubmit(formData as NFTPurchaseRequest);
        } catch (error) {
            console.error('Error updating request:', error);
            antMessage.error('リクエストの更新に失敗しました');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* フォームの内容 */}
        </form>
    );
}; 