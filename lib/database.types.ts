export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    display_id: string | null
                    name: string | null
                    email: string | null
                    active: boolean
                    created_at: string
                    referrer_id: string | null
                    // ... 他のフィールド
                }
                // ... Insert, Update 型も定義
            }
            nft_purchase_requests: {
                Row: {
                    id: string
                    user_id: string
                    status: string
                    nft_settings_id: string
                    // ... 他のフィールド
                }
            }
            nft_settings: {
                Row: {
                    id: string
                    price: number
                    // ... 他のフィールド
                }
            }
        }
    }
} 