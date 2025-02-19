export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      nfts: {
        Row: {
          nft_id: string
          user_id: string
          approved_at: string
          status: string
          created_at: string
          updated_at: string
          nft_settings_id: string
        }
        Insert: {
          nft_id: string
          user_id: string
          approved_at: string
          status: string
          created_at?: string
          updated_at?: string
          nft_settings_id: string
        }
        Update: {
          nft_id?: string
          user_id?: string
          approved_at?: string
          status?: string
          created_at?: string
          updated_at?: string
          nft_settings_id?: string
        }
      }
      nft_settings: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          daily_rate: number
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          daily_rate: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          daily_rate?: number
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      airdrop_tasks: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'completed' | 'failed'
          profit_amount: number
          created_at: string
          profit_period_start: string
          profit_period_end: string
          payment_date: string
        }
        Insert: {
          id?: string
          user_id: string
          status: 'pending' | 'completed' | 'failed'
          profit_amount: number
          created_at?: string
          profit_period_start: string
          profit_period_end: string
          payment_date: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'completed' | 'failed'
          profit_amount?: number
          created_at?: string
          profit_period_start?: string
          profit_period_end?: string
          payment_date?: string
        }
      }
      daily_profits: {
        Row: {
          id: string
          amount: number
          date: string
          nft_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          amount: number
          date: string
          nft_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          amount?: number
          date?: string
          nft_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 