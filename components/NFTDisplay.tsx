'use client'

import React from 'react'
import { format } from 'date-fns'
import { calculateOperationDates } from '@/lib/utils/dateCalculations'
import { NFTType } from '@/types/nft'

interface NFTDisplayProps {
    nft: {
        id: string;
        purchase_date: string;
        name: string;
        price: number;
        daily_rate: number;
        status: string;
    };
}

export default function NFTDisplay({ nft }: NFTDisplayProps) {
    // NFTの運用開始日を計算
    const operationStartDate = calculateOperationDates(new Date(nft.purchase_date)).operationStartDate;

    // 表示用のフォーマット
    const formattedStartDate = format(operationStartDate, 'yyyy/MM/dd');
    const formattedPrice = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'USD'
    }).format(nft.price);

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">{nft.name}</h2>
            
            <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                    <span>運用開始日:</span>
                    <span className="text-blue-400">{formattedStartDate}</span>
                </div>
                
                <div className="flex justify-between">
                    <span>投資額:</span>
                    <span className="text-green-400">{formattedPrice}</span>
                </div>
                
                <div className="flex justify-between">
                    <span>日利:</span>
                    <span className="text-yellow-400">{nft.daily_rate}%</span>
                </div>
                
                <div className="flex justify-between">
                    <span>ステータス:</span>
                    <span className={`${
                        nft.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {nft.status === 'active' ? '運用中' : '停止中'}
                    </span>
                </div>
            </div>
        </div>
    );
} 