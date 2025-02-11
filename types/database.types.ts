export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string | null
                    name_kana: string | null
                    role: string | null
                    created_at: string
                    updated_at: string | null
                    investment: number | null
                    nft_purchase_date: string | null
                    active: boolean | null
                    initial_investment_date: string | null
                    email: string | null
                    display_id: string | null
                    phone: string | null
                    status: string | null
                    wallet_address: string | null
                    wallet_type: string | null
                }
                Insert: {
                    id: string
                    role?: string
                    // 他のフィールドは省略
                }
                Update: {
                    id?: string
                    role?: string
                    // 他のフィールドは省略
                }
            }
            // 他のテーブルも同様に定義
        }
    }
} 