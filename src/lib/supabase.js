import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function makeClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  try {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  } catch (e) {
    console.error('Supabase client init failed:', e)
    return null
  }
}

export const supabase = makeClient()
export const isSupabaseConfigured = !!supabase
