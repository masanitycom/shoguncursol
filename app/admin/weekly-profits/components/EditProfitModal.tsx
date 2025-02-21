'use client'

import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import { WeeklyProfitRecord } from '@/types/profit'
import { updateWeeklyProfit } from '@/lib/services/profit'

interface EditProfitModalProps {
    profit: WeeklyProfitRecord | null
    isVisible: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function EditProfitModal({ profit, isVisible, onClose, onSuccess }: EditProfitModalProps) {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (profit) {
            form.setFieldsValue({
                weekStart: profit.week_start.split('T')[0],
                weekEnd: profit.week_end.split('T')[0],
                totalProfit: profit.total_profit,
                shareRate: profit.share_rate
            })
        }
    }, [profit, form])

    const handleSubmit = async (values: any) => {
        if (!profit) return

        try {
            setLoading(true)
            const result = await updateWeeklyProfit(profit.id, {
                weekStart: values.weekStart,
                weekEnd: values.weekEnd,
                totalProfit: Number(values.totalProfit),
                shareRate: values.shareRate
            })

            if (result.success) {
                message.success('更新しました')
                onSuccess()
                onClose()
            } else {
                throw result.error
            }
        } catch (error) {
            console.error('Error updating profit:', error)
            message.error('更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title={<span className="text-white">週次利益の編集</span>}
            open={isVisible}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText="更新"
            cancelText="キャンセル"
            confirmLoading={loading}
            width={600}
            className="edit-profit-modal"
            styles={{
                content: {
                    background: '#1f2937',
                },
                mask: {
                    backgroundColor: 'rgba(0, 0, 0, 0.6)'
                }
            }}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="text-white"
            >
                <Form.Item
                    label={<span className="text-white">開始日</span>}
                    name="weekStart"
                    rules={[{ required: true, message: '開始日を入力してください' }]}
                >
                    <Input 
                        type="date" 
                        className="h-12 w-full bg-gray-700 text-white border-gray-500 
                            hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white" 
                    />
                </Form.Item>

                <Form.Item
                    label={<span className="text-white">終了日</span>}
                    name="weekEnd"
                    rules={[{ required: true, message: '終了日を入力してください' }]}
                >
                    <Input 
                        type="date" 
                        className="h-12 w-full bg-gray-700 text-white border-gray-500 
                            hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white" 
                    />
                </Form.Item>

                <Form.Item
                    label={<span className="text-white">総利益（USD）</span>}
                    name="totalProfit"
                    rules={[{ required: true, message: '総利益を入力してください' }]}
                >
                    <Input 
                        type="number" 
                        min={0} 
                        step="0.01" 
                        className="h-12 w-full bg-gray-700 text-white border-gray-500 
                            hover:bg-gray-600 hover:text-white focus:bg-gray-600 focus:text-white"
                    />
                </Form.Item>

                <Form.Item
                    label={<span className="text-white">分配率（%）</span>}
                    name="shareRate"
                    rules={[{ required: true, message: '分配率を選択してください' }]}
                >
                    <Select
                        className="h-12 w-full text-white"
                        popupClassName="bg-gray-700"
                        style={{ backgroundColor: '#374151' }}
                        dropdownStyle={{ backgroundColor: '#374151' }}
                    >
                        <Select.Option value={20} className="h-10 flex items-center">20%</Select.Option>
                        <Select.Option value={22} className="h-10 flex items-center">22%</Select.Option>
                        <Select.Option value={25} className="h-10 flex items-center">25%</Select.Option>
                        <Select.Option value={30} className="h-10 flex items-center">30%</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    )
} 