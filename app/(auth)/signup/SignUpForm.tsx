'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

interface Props {
    defaultReferrerId?: string
}

export default function SignUpForm({ defaultReferrerId }: Props = {}) {
    const router = useRouter()
    const [formData, setFormData] = useState({
        nameKana: '',
        userId: '',
        email: '',
        password: '',
        phone: '',
        referrerId: defaultReferrerId || '',
        usdtAddress: '',
        walletType: ''
    })

    // ... 他のステート、ハンドラーなど

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* フォームのJSX */}
        </div>
    )
} 