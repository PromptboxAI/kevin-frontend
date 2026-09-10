import { API_BASE_URL } from './env'
import { isAuthConfigured } from './env'
import { getSupabase } from './supabase'

/** FastAPI's error shape: { detail: string | FieldError[] } */
export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown
  readonly requestId: string | null
  /** Seconds to wait, from the Retry-After header on a 429. */
  readonly retryAfter: number | null

  constructor(
    status: number,
    detail: unknown,
    requestId: string | null,
    retryAfter: number | null = null,
  ) {
    super(typeof detail === 'string' ? detail : `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.requestId = requestId
    this.retryAfter = retryAfter
  }

  /**
   * A message worth showing.
   *
   * A 422's `detail` is FastAPI's array of validation objects, and String()ing
   * it renders "[object Object]" -- which told us a create had failed but not
   * which field the API rejected. This names the field and the reason.
   */
  get message422(): string {
    const d = this.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      return d
        .map((e) => {
          const item = e as { loc?: unknown[]; msg?: string; type?: string }
          const field = Array.isArray(item.loc)
            ? item.loc.filter((p) => p !== 'body').join('.')
            : ''
          return [field, item.msg ?? item.type ?? 'invalid'].filter(Boolean).join(': ')
        })
        .join(' · ')
    }
    try {
      return JSON.stringify(d)
    } catch {
      return `HTTP ${this.status}`
    }
  }

  /** 404 is deliberately "not found OR not yours" -- never distinguish them. */
  get isMissing() {
    return this.status === 404
  }
  get isUnauthenticated() {
    return this.status === 401
  }
  get isRateLimited() {
    return this.status === 429
  }
}

/**
 * A react-query `retry` for reads where a 404 is an ANSWER, not a blip.
 *
 * The default retries every failure three times with backoff -- about seven
 * seconds -- so a claim URL that does not exist sat on a live-looking
 * worksheet, slug for a title and Export in reach, before the error landed.
 * Anything else still gets the default three tries.
 */
export function retryUnlessMissing(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.isMissing) return false
  return failureCount < 3
}

type Options = Omit<RequestInit, 'body'> & {
  /** JSON body. Omit for multipart -- pass a FormData as `form` instead. */
  json?: unknown
  form?: FormData
  /** Retries on 429 honouring Retry-After. Reads are safe to retry; writes are not. */
  retryOnRateLimit?: boolean
}

async function authHeader(): Promise<Record<string, string>> {
  // Public routes (the client portal) run with no session and no Supabase keys.
  if (!isAuthConfigured) return {}
  const { data } = await getSupabase().auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * One place where every backend call gets its auth header, correlation id and
 * error normalisation. Branch on ApiError.status, never on message text.
 */
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { json, form, retryOnRateLimit = false, headers, ...init } = options

  const send = async (): Promise<Response> => {
    const merged: Record<string, string> = {
      ...(await authHeader()),
      // Echoed back by the backend; log it to make support trivial.
      'X-Request-ID': crypto.randomUUID(),
      ...(headers as Record<string, string> | undefined),
    }
    // Content-Type is set by the browser for FormData (it carries the boundary).
    if (json !== undefined) merged['Content-Type'] = 'application/json'

    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: merged,
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
    })
  }

  let response = await send()

  if (response.status === 429 && retryOnRateLimit) {
    const wait = Number(response.headers.get('Retry-After') ?? 1)
    await new Promise((resolve) => setTimeout(resolve, wait * 1000))
    response = await send()
  }

  const requestId = response.headers.get('X-Request-ID')

  if (!response.ok) {
    let detail: unknown = response.statusText
    try {
      detail = (await response.json()).detail
    } catch {
      /* non-JSON error body (gateway timeout, proxy page) */
    }
    const retryAfter = response.headers.get('Retry-After')
    throw new ApiError(response.status, detail, requestId, retryAfter ? Number(retryAfter) : null)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: Options) =>
    request<T>(path, { ...options, method: 'GET', retryOnRateLimit: true }),
  post: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'POST' }),
  patch: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'PATCH' }),
  delete: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'DELETE' }),
}

/**
 * The client portal is token-scoped and unauthenticated -- a separate router on
 * the backend with no require_user. A dead link (unknown, expired or revoked)
 * answers 410, deliberately distinct from a 404 dead route, and all three
 * causes are indistinguishable by design so a holder cannot probe them.
 */
export const portal = {
  get: <T>(token: string, path = '') =>
    request<T>(`/p/${encodeURIComponent(token)}${path}`, {
      method: 'GET',
      retryOnRateLimit: true,
    }),
  post: <T>(token: string, path = '', options?: Options) =>
    request<T>(`/p/${encodeURIComponent(token)}${path}`, { ...options, method: 'POST' }),
  patch: <T>(token: string, path = '', options?: Options) =>
    request<T>(`/p/${encodeURIComponent(token)}${path}`, { ...options, method: 'PATCH' }),
}

/**
 * Exports are server-generated binaries (xlsx | pdf) with a
 * Content-Disposition filename -- not JSON, so they bypass request().
 *
 * Fetching is separate from what happens next, because "download it" and
 * "print it" are different endings to the same request.
 */
async function fetchBinary(path: string): Promise<{ blob: Blob; filename: string | null }> {
  const { data } = await (await import('./supabase')).getSupabase().auth.getSession()
  const token = data.session?.access_token
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new ApiError(response.status, await response.text(), response.headers.get('X-Request-ID'))
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  return { blob: await response.blob(), filename: match?.[1] ?? null }
}

async function downloadBinary(path: string, fallbackName: string) {
  const { blob, filename } = await fetchBinary(path)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** The Proof of Loss. STAMPS `exported_at` -- never call it for a preview. */
export function downloadExport(claimId: string, format: 'xlsx' | 'pdf' = 'xlsx') {
  return downloadBinary(
    `/v1/claims/${encodeURIComponent(claimId)}/export?format=${format}`,
    `${claimId}-inventory.${format}`,
  )
}

/**
 * Print the inventory PDF: open the browser's print dialog on it.
 *
 * "Print" in the claims menu used to call downloadExport(…, 'pdf'), so it put
 * up a save-to-computer dialog instead of a print dialog. Worse, it hits the
 * SAME endpoint, so on a claim not yet exported it silently and permanently
 * stamped the Proof of Loss date -- the one irreversible action the worksheet
 * guards behind a confirm. THIS STILL STAMPS: there is no non-stamping PDF
 * route (the old /preview was removed). Callers must confirm first on an
 * unexported claim, exactly as they do before downloadExport.
 *
 * Printed from a hidden iframe over a blob URL. That opens the real print
 * dialog in Chrome, Edge and Firefox; where the browser refuses to print a PDF
 * from a frame, it falls back to opening the PDF in a tab, which carries its
 * own print button -- a new tab beats a silent no-op.
 */
export async function printExport(claimId: string): Promise<void> {
  const { blob } = await fetchBinary(
    `/v1/claims/${encodeURIComponent(claimId)}/export?format=pdf`,
  )
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  frame.src = url
  document.body.appendChild(frame)
  await new Promise<void>((resolve) => {
    frame.onload = () => resolve()
  })
  try {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
  } catch {
    window.open(url, '_blank', 'noopener')
  }
  // The print dialog holds the document until it closes, and there is no
  // reliable "printed" event, so the frame is cleaned up well after.
  window.setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 60_000)
}

/**
 * The Depreciation Recovery Request -- a DIFFERENT document, not a variant.
 *
 * Does NOT stamp `exported_at`: that marker means the Proof of Loss went out
 * and drives the claim's derived status, so this one is safe to call again and
 * again as receipts arrive. `409` when no line carries a `claimed_rcv`.
 */
export function downloadRecovery(claimId: string, format: 'xlsx' | 'pdf' = 'xlsx') {
  return downloadBinary(
    `/v1/claims/${encodeURIComponent(claimId)}/holdback-export?format=${format}`,
    `${claimId}-recovery-request.${format}`,
  )
}
