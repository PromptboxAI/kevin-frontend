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

/**
 * The backend origin, normalised.
 *
 * A value with no scheme is the easy mistake — "kevin-backend-production.up
 * .railway.app" pasted from a dashboard — and its failure mode is bizarre
 * rather than obvious: fetch treats it as a RELATIVE path, so a call from
 * /claims/sample goes to
 *   /claims/kevin-backend-production.up.railway.app/v1/claims/sample
 * which the SPA rewrite answers with index.html and a 200. No CORS error, no
 * 404 — just HTML parsed as JSON and a page of blank data. That shipped to
 * production and broke every API call on the site.
 *
 * So a scheme-less value is upgraded to https rather than trusted, and the
 * console says so once, because the env var is still wrong at source.
 */
function normalizeApiBase(raw: string): string {
  const value = raw.replace(/\/$/, '')
  if (!value || /^https?:\/\//i.test(value)) return value
  if (import.meta.env.DEV || typeof console !== 'undefined') {
    console.warn(
      `VITE_API_BASE_URL has no scheme ("${value}") — using https://${value}. ` +
        'Set the full origin in the environment; without a scheme fetch treats it as a relative path.',
    )
  }
  return `https://${value}`
}

export const API_BASE_URL = normalizeApiBase(read('VITE_API_BASE_URL'))
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
