import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
// Get them from: https://app.supabase.com → Your Project → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// If Supabase credentials not configured, supabase will be null
// The app falls back to localStorage gracefully in that case
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const isSupabaseConfigured = !!supabase
