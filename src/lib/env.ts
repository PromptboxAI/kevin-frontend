/**
 * Config is read, not asserted, at module load.
 *
 * The client portal (/p/:token) is PUBLIC -- it must render for an insured who
 * has no account and never touches Supabase. Throwing here would white-screen
 * that route whenever auth keys are absent, which is exactly the 404-class
 * failure the portal exists to avoid. Auth screens call assertAuthConfigured().
 *
 * Source: kevin-backend/FRONTEND.md section 7.
 */
function read(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name] ?? ''
  // Treat the shipped .env.example placeholders as absent.
  if (value.startsWith('<') || value.includes('xxxxxxxx')) return ''
  return value
}

export const API_BASE_URL = read('VITE_API_BASE_URL').replace(/\/$/, '')
export const SUPABASE_URL = read('VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = read('VITE_SUPABASE_ANON_KEY')

export const isApiConfigured = API_BASE_URL !== ''
export const isAuthConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== ''

export function assertAuthConfigured(): void {
  if (!isAuthConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    )
  }
}

export function assertApiConfigured(): void {
  if (!isApiConfigured) {
    throw new Error('Set VITE_API_BASE_URL in .env.local to the backend web service origin.')
  }
}
