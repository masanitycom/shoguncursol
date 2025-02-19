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
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          email: string | null
          investment_amount: number
          total_team_investment: number
          max_line_investment: number
          other_lines_investment: number
          referrer_id: string | null
          display_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          email?: string | null
          investment_amount?: number
          total_team_investment?: number
          max_line_investment?: number
          other_lines_investment?: number
          referrer_id?: string | null
          display_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          email?: string | null
          investment_amount?: number
          total_team_investment?: number
          max_line_investment?: number
          other_lines_investment?: number
          referrer_id?: string | null
          display_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      nft_settings: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          daily_rate: number
          image_url: string | null
          created_at: string
          status: 'active' | 'inactive'
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          daily_rate: number
          image_url?: string | null
          created_at?: string
          status?: 'active' | 'inactive'
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          daily_rate?: number
          image_url?: string | null
          created_at?: string
          status?: 'active' | 'inactive'
        }
      }
      nft_purchase_requests: {
        Row: {
          id: string
          user_id: string
          nft_settings_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nft_settings_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nft_settings_id?: string
          status?: 'pending' | 'approved' | 'rejected'
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