import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

function resolveSupabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  return raw.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '')
}

const supabaseUrl = resolveSupabaseUrl()
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''

export function isSupabaseConfigured() {
  return supabaseUrl.startsWith('https://') && supabaseKey.length > 0
}

let browserClient: SupabaseClient<Database> | null = null

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return browserClient
}
