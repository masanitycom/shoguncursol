'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import Header from '../../../../components/Header'
import AdminSidebar from '../../../../components/AdminSidebar'

interface NFTForm {
    name: string
    price: number
    daily_rate: number
    image_url: string | null
    is_special: boolean
}

export default function NewNFTPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [formData, setFormData] = useState<NFTForm>({
        name: '',
        price: 300,
        daily_rate: 0.005, // 0.5%
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
        console.log('Validating form:', {
            ...formData,
            price: formData.price,
            priceType: typeof formData.price,
            isSpecial: formData.is_special
        })

        if (!formData.name) return 'NFT名は必須です'
        if (!formData.price && formData.price !== 0) return '価格は必須です'
        if (!formData.daily_rate) return '日利は必須です'
        if (!imageFile && !formData.image_url) return '画像は必須です'

        const price = Number(formData.price)
        console.log('Converted price:', {
            price,
            priceType: typeof price,
            isSpecial: formData.is_special
        })

        // 特例NFTの価格チェック
        if (formData.is_special) {
            const specialPrices = [100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000]
            console.log('Checking special price:', {
                price,
                specialPrices,
                includes: specialPrices.includes(price),
                isSpecial: formData.is_special
            })
            
            if (!specialPrices.includes(price)) {
                console.log('Invalid special price')
                return '特例NFTの価格が不正です'
            }
            return null
        }

        // 通常NFTの価格チェック
        const validPrices = [300, 500, 1000, 3000, 5000, 10000, 30000, 100000]
        if (!validPrices.includes(price)) {
            console.log('Invalid regular price')
            return '通常NFTの価格が不正です'
        }

        return null
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0])
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
            if (price <= 600) return 0.005 // 0.5%
            if (price <= 5000) return 0.01 // 1%
            if (price === 1000) return 0.0125 // 1.25% (特別対応)
            return 0.0125 // 6600以上は1.25%
        }

        // 通常NFT
        if (price <= 500) return 0.005 // 0.5%
        if (price <= 5000) return 0.01 // 1%
        if (price === 10000) return 0.0125 // 1.25%
        if (price === 30000) return 0.015 // 1.5%
        if (price === 50000) return 0.0175 // 1.75%
        return 0.02 // 100,000は2%
    }

    // priceが変更されたときに日利を自動設定
    const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrice = Number(e.target.value)
        console.log('Price change:', {
            value: e.target.value,
            newPrice,
            priceType: typeof newPrice
        })
        
        const newDailyRate = getDefaultDailyRate(newPrice, formData.is_special)
        
        // 直接オブジェクトを作成して更新
        const updatedData = {
            ...formData,
            price: newPrice,
            daily_rate: newDailyRate
        }
        
        console.log('Updated form data:', updatedData)
        setFormData(updatedData)
    }

    // 特例NFTの切り替え時に日利を再計算
    const handleSpecialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isSpecial = e.target.checked
        console.log('Special change:', isSpecial)
        
        // 特例NFTに切り替えた時は、デフォルトで100USDTを選択
        const newPrice = isSpecial ? 100 : 300
        const newDailyRate = getDefaultDailyRate(newPrice, isSpecial)
        
        console.log('New special price:', {
            isSpecial,
            newPrice,
            newDailyRate,
            priceType: typeof newPrice
        })
        
        // 直接オブジェクトを作成して更新
        const updatedData = {
            ...formData,
            is_special: isSpecial,
            price: newPrice,
            daily_rate: newDailyRate
        }
        
        console.log('Updated form data:', updatedData)
        setFormData(updatedData)
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
            <Header user={user} isAdmin={true} />
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
                                <select
                                    value={String(formData.price)}
                                    onChange={handlePriceChange}
                                    className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                                >
                                    {formData.is_special ? (
                                        <>
                                            <option value="100">100 USDT</option>
                                            <option value="200">200 USDT</option>
                                            <option value="600">600 USDT</option>
                                            <option value="1177">1,177 USDT</option>
                                            <option value="1300">1,300 USDT</option>
                                            <option value="1500">1,500 USDT</option>
                                            <option value="2000">2,000 USDT</option>
                                            <option value="6600">6,600 USDT</option>
                                            <option value="8000">8,000 USDT</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="300">300 USDT</option>
                                            <option value="500">500 USDT</option>
                                            <option value="1000">1,000 USDT</option>
                                            <option value="3000">3,000 USDT</option>
                                            <option value="5000">5,000 USDT</option>
                                            <option value="10000">10,000 USDT</option>
                                            <option value="30000">30,000 USDT</option>
                                            <option value="100000">100,000 USDT</option>
                                        </>
                                    )}
                                </select>
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