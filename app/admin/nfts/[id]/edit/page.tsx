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

interface HTMLInputEvent extends Event {
    target: HTMLInputElement & EventTarget;
}

export default function EditNFTPage({ params }: { params: { id: string } }) {
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
        fetchNFT()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.email || session.user.email !== 'testadmin@gmail.com') {
            router.push('/admin/login')
            return
        }
        setUser(session.user)
    }

    const fetchNFT = async () => {
        try {
            console.log('Fetching NFT:', params.id)

            const { data, error } = await supabase
                .from('nft_master')
                .select('*')
                .eq('id', params.id)
                .single()

            console.log('Fetch response:', { data, error })

            if (error) throw error
            if (data) {
                setFormData({
                    name: data.name,
                    price: Number(data.price),
                    daily_rate: Number(data.daily_rate),
                    image_url: data.image_url,
                    is_special: data.is_special
                })
            }
        } catch (error: any) {
            console.error('Error fetching NFT:', error)
            setError(error.message)
        }
    }

    // 日利計算などの関数は新規登録ページと同じ
    const getDefaultDailyRate = (price: number, isSpecial: boolean): number => {
        if (isSpecial) {
            if (price <= 600) return 0.005
            if (price <= 5000) return 0.01
            if (price === 1000) return 0.0125
            return 0.0125
        }

        if (price <= 500) return 0.005
        if (price <= 5000) return 0.01
        if (price === 10000) return 0.0125
        if (price === 30000) return 0.015
        if (price === 50000) return 0.0175
        return 0.02
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrice = Number(e.target.value)
        console.log('New price:', newPrice, typeof newPrice)
        const newDailyRate = getDefaultDailyRate(newPrice, formData.is_special)
        setFormData({
            ...formData,
            price: newPrice,
            daily_rate: newDailyRate
        })
    }

    const handleSpecialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checkbox = e.target as unknown as { checked: boolean }
        const isSpecial = checkbox.checked
        console.log('Special change:', isSpecial)
        
        // 特例NFTに切り替えた時は、デフォルトで100USDTを選択
        if (isSpecial) {
            setFormData(prev => ({
                ...prev,
                price: 100,
                daily_rate: getDefaultDailyRate(100, true)
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                price: 300,
                daily_rate: getDefaultDailyRate(300, false)
            }))
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // バリデーション前のデータをログ出力
        console.log('Form data before validation:', {
            ...formData,
            price: formData.price,
            priceType: typeof formData.price
        })

        // バリデーションを追加
        const validationError = validateForm()
        if (validationError) {
            console.log('Validation error:', validationError) // エラー内容を出力
            setError(validationError)
            return
        }

        setLoading(true)
        setError(null)

        try {
            console.log('Updating NFT:', params.id, formData)

            let imageUrl = formData.image_url
            if (imageFile) {
                // 古い画像を削除
                if (formData.image_url) {
                    const oldFilePath = formData.image_url.split('/').pop()
                    if (oldFilePath) {
                        await supabase.storage
                            .from('nfts')
                            .remove([`nft-images/${oldFilePath}`])
                    }
                }
                imageUrl = await uploadImage()
            }

            // 更新データの準備
            const updateData = {
                name: formData.name,
                price: Number(formData.price), // 明示的に数値型に変換
                daily_rate: Number(formData.daily_rate), // 明示的に数値型に変換
                image_url: imageUrl,
                is_special: formData.is_special,
                status: 'active'
            }

            console.log('Update data:', {
                ...updateData,
                priceType: typeof updateData.price
            })

            // 更新を実行
            const { data, error: updateError } = await supabase
                .from('nft_master')
                .update(updateData)
                .eq('id', params.id) // .match()ではなく.eq()を使用
                .select()
                .single()

            console.log('Update response:', { data, error: updateError })

            if (updateError) {
                throw updateError
            }

            if (!data) {
                throw new Error('NFTの更新に失敗しました')
            }

            // 成功したら一覧ページに戻る
            router.push('/admin/nfts')
            
        } catch (error: any) {
            console.error('Error updating NFT:', error)
            setError(error.message || '更新に失敗しました')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = (): string | null => {
        console.log('Validating form:', {
            ...formData,
            price: formData.price,
            priceType: typeof formData.price
        })

        if (!formData.name) return 'NFT名は必須です'
        if (!formData.price && formData.price !== 0) return '価格は必須です'
        if (!formData.daily_rate) return '日利は必須です'

        const price = Number(formData.price)
        console.log('Converted price:', price, typeof price)

        // 特例NFTの価格チェック（先に行う）
        if (formData.is_special) {
            const specialPrices = [100, 200, 600, 1177, 1300, 1500, 2000, 6600, 8000]
            console.log('Checking special price:', {
                price,
                specialPrices,
                includes: specialPrices.includes(price)
            })
            if (!specialPrices.includes(price)) {
                return '特例NFTの価格が不正です'
            }
            return null // 特例NFTの場合はここで検証終了
        }

        // 通常NFTの価格チェック
        const validPrices = [300, 500, 1000, 3000, 5000, 10000, 30000, 100000]
        console.log('Checking regular price:', {
            price,
            validPrices,
            includes: validPrices.includes(price)
        })
        if (!validPrices.includes(price)) {
            return '通常NFTの価格が不正です'
        }

        return null
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
                        <h3 className="text-3xl font-medium text-white mb-8">NFT編集</h3>

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
                                        // 特例NFTの価格選択肢
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
                                        // 通常NFTの価格選択肢
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
                                    現在の画像
                                </label>
                                {formData.image_url && (
                                    <img
                                        src={formData.image_url}
                                        alt={formData.name}
                                        className="w-32 h-32 object-cover rounded mb-4"
                                    />
                                )}
                                <label className="block text-gray-300 mb-2">
                                    新しい画像をアップロード
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
                                {loading ? '更新中...' : '更新する'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    )
} 