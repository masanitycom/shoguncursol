'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/lib/auth'

interface NFTForm {
    name: string
    price: number
    daily_rate: number
    image_url: string | null
    is_special: boolean
}

export default function NewNFTPage() {
    const router = useRouter()
    const { handleLogout } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [formData, setFormData] = useState<NFTForm>({
        name: '',
        price: 300,
        daily_rate: 0.005,
        image_url: null,
        is_special: false
    })

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const validateForm = (): string | null => {
        if (!formData.name) return 'NFT名は必須です'
        if (!formData.price && formData.price !== 0) return '価格は必須です'
        if (!formData.daily_rate) return '日利は必須です'
        if (!imageFile && !formData.image_url) return '画像は必須です'
        return null
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target as unknown as { files: File[] | null }
        if (input.files && input.files[0]) {
            setImageFile(input.files[0])
        }
    }

    const uploadImage = async (): Promise<string> => {
        if (!imageFile) throw new Error('画像ファイルが選択されていません')

        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `nft-images/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('nfts')
            .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('nfts')
            .getPublicUrl(filePath)

        return publicUrl
    }

    const getDefaultDailyRate = (price: number, isSpecial: boolean): number => {
        if (isSpecial) {
            // 特例NFTの特別ケース
            if (price === 1000 || price === 10000) return 0.0125  // 1.25%
            if (price <= 600) return 0.005  // 0.5%
            return 0.01  // その他は1.0%
        }

        // 通常NFT
        if (price <= 500) return 0.005    // 0.5%
        if (price <= 5000) return 0.01    // 1.0%
        if (price <= 10000) return 0.0125 // 1.25%
        if (price <= 30000) return 0.015  // 1.5%
        if (price <= 50000) return 0.0175 // 1.75%
        return 0.02 // 2.0%
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = Number(e.target.value)
        const newDailyRate = getDefaultDailyRate(newPrice, formData.is_special)
        setFormData({
            ...formData,
            price: newPrice,
            daily_rate: newDailyRate
        })
    }

    const handleSpecialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isSpecial = e.target.checked
        const newPrice = formData.price
        const newDailyRate = getDefaultDailyRate(newPrice, isSpecial)
        
        setFormData({
            ...formData,
            is_special: isSpecial,
            daily_rate: newDailyRate
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)

        try {
            let imageUrl = formData.image_url
            if (imageFile) {
                imageUrl = await uploadImage()
            }

            const { error: insertError } = await supabase
                .from('nft_master')
                .insert({
                    name: formData.name,
                    price: formData.price,
                    daily_rate: formData.daily_rate,
                    image_url: imageUrl,
                    is_special: formData.is_special
                })

            if (insertError) throw insertError

            router.push('/admin/nfts')
        } catch (error: any) {
            console.error('Error creating NFT:', error)
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
                        <h3 className="text-3xl font-medium text-white mb-8">新規NFT登録</h3>

                        <form onSubmit={handleSubmit} className="max-w-lg bg-gray-800 p-6 rounded-lg">
                            {error && (
                                <div className="mb-4 text-red-500">{error}</div>
                            )}

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">
                                    NFT名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">
                                    特例NFT
                                </label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_special}
                                    onChange={handleSpecialChange}
                                    className="mr-2"
                                />
                                <span className="text-gray-300">特例NFTとして登録</span>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">
                                    価格（USDT） <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={handlePriceChange}
                                        className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                        placeholder="価格を入力"
                                    />
                                    {formData.is_special && (
                                        <div className="text-sm text-gray-400">
                                            日利: {formData.price === 1000 || formData.price === 10000 ? '1.25%' : 
                                                  formData.price <= 600 ? '0.5%' : '1.0%'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-300 mb-2">
                                    日利上限（%） <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.daily_rate}
                                    onChange={(e) => setFormData({...formData, daily_rate: Number(e.target.value)})}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                >
                                    <option value="0.005">0.5%</option>
                                    <option value="0.01">1.0%</option>
                                    <option value="0.0125">1.25%</option>
                                    <option value="0.015">1.5%</option>
                                    <option value="0.0175">1.75%</option>
                                    <option value="0.02">2.0%</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 mb-2">
                                    NFT画像 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '登録中...' : '登録する'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
} 