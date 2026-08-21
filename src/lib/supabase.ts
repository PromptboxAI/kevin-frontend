import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertAuthConfigured } from './env'

let client: SupabaseClient | null = null

/**
 * Lazy singleton: constructing this at module scope would require auth keys on
 * every route, including the public portal. The backend issues no tokens -- it
 * verifies the JWT this client produces.
 */
export function getSupabase(): SupabaseClient {
  assertAuthConfigured()
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  }
  return client
}
