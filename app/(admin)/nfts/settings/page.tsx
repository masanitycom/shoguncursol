"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function NFTSettingsPage() {
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<any[]>([])

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('nft_settings')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setSettings(data || [])
        } catch (error) {
            console.error('Error fetching settings:', error)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">NFT設定</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    名前
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    作成日
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {settings.map((setting) => (
                                <tr key={setting.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {setting.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {setting.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(setting.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}