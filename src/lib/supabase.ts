import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y completa los valores.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Room = {
  id: string
  code: string
  host_token: string
  called_numbers: number[]
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
}
