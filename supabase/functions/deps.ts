// @ts-ignore
import { serve } from "https://deno.land/std@0.140.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: any
  schema: string
  old_record: any | null
}

export { serve, createClient }
