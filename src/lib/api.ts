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

/**
 * While the public sample claim is on screen, every API call goes out WITHOUT
 * the signed-in user's token.
 *
 * The sample is served to anonymous callers. Send a token and the backend
 * reads the call as "one of MY claims" and answers 404 -- measured on
 * 2026-09-11: /v1/claims/sample, its rooms, photos and proposals, and
 * /v1/claim_items/{id} for its rows were all 200 anonymous and 404 signed in.
 * So a signed-in adjuster who clicked "See a finished claim" got "Claim not
 * found", and the item panel could not open a row. A path rule cannot catch
 * it -- /v1/claim_items/8081 does not say "sample" -- so the worksheet sets
 * this for as long as it shows the sample, and clears it on the way out.
 */
let anonymousMode = false
export function setAnonymousMode(on: boolean) {
  anonymousMode = on
}

/**
 * Calls about the VIEWER, not the claim, keep the token even in anonymous
 * mode: /v1/me is the signed-in account (the header's avatar reads it), and
 * sending it anonymously just 401s and caches that as the account.
 */
function keepsToken(path: string): boolean {
  return path === '/v1/me' || path.startsWith('/v1/me?') || path.startsWith('/v1/me/')
}

async function authHeader(path: string): Promise<Record<string, string>> {
  // Public routes (the client portal) run with no session and no Supabase keys.
  if (!isAuthConfigured || (anonymousMode && !keepsToken(path))) return {}
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
      ...(await authHeader(path)),
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
async function fetchBinary(
  path: string,
): Promise<{ blob: Blob; filename: string | null; headers: Headers }> {
  const { data } = await (await import('./supabase')).getSupabase().auth.getSession()
  const token = anonymousMode ? undefined : data.session?.access_token
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new ApiError(response.status, await response.text(), response.headers.get('X-Request-ID'))
  }
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="?([^"]+)"?/.exec(disposition)
  return { blob: await response.blob(), filename: match?.[1] ?? null, headers: response.headers }
}

async function downloadBinary(path: string, fallbackName: string): Promise<Headers> {
  const { blob, filename, headers } = await fetchBinary(path)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return headers
}

/**
 * What the PDF carries. The .xlsx is always the worksheet alone.
 * `worksheet` = inventory only (today's PDF) · `photos` = captioned photo
 * pages only · `packet` = the inventory, then the photo pages.
 */
export type PdfContents = 'worksheet' | 'photos' | 'packet'
export type PhotosPerPage = 1 | 2 | 4 | 6

export type ExportOptions = {
  /** PDF only. */
  contents?: PdfContents
  /** PDF with photos only (`photos` or `packet`). */
  photosPerPage?: PhotosPerPage
}

/** What the server says it actually built, from the response headers. */
export type ExportResult = {
  /** `X-Export-Contents`: worksheet | photos | packet. Null if not exposed. */
  contents: string | null
  /** `X-Export-Photos`: photo cells printed. 0 on a packet = no linked photos. */
  photos: number | null
}

/**
 * The Proof of Loss. STAMPS `exported_at` -- never call it for a preview.
 *
 * `contents` / `photos_per_page` are sent ONLY for a PDF with photos
 * (backend 3c193aa: `packet`; `photos` is the pending addendum). FastAPI drops
 * an undeclared param silently, so callers verify against X-Export-Contents
 * rather than trusting the query string (FRONTEND.md "Photo packet").
 */
export async function downloadExport(
  claimId: string,
  format: 'xlsx' | 'pdf' = 'xlsx',
  options: ExportOptions = {},
): Promise<ExportResult> {
  const qs = new URLSearchParams({ format })
  if (format === 'pdf' && options.contents && options.contents !== 'worksheet') {
    qs.set('contents', options.contents)
    qs.set('photos_per_page', String(options.photosPerPage ?? 2))
  }
  const headers = await downloadBinary(
    `/v1/claims/${encodeURIComponent(claimId)}/export?${qs.toString()}`,
    `${claimId}-inventory.${format}`,
  )
  const photos = headers.get('X-Export-Photos')
  return {
    contents: headers.get('X-Export-Contents'),
    photos: photos === null || photos === '' ? null : Number(photos),
  }
}

/**
 * "Print": open the inventory PDF in a new browser tab.
 *
 * The browser's PDF viewer carries its own print and save buttons, which is how
 * Xactimate does it -- the adjuster sees the document first, then prints. This
 * used to print from a hidden iframe, which jumped straight to the operating
 * system's print dialog without ever showing the PDF.
 *
 * STILL STAMPS `exported_at` on a claim's first export: it is the same
 * endpoint as downloadExport, and there is no non-stamping PDF route.
 *
 * MUST be called synchronously from the click. The tab is opened BEFORE the
 * fetch because pop-up blockers only allow a window.open inside the user's
 * gesture, and the gesture is gone by the time the PDF arrives. The blank tab
 * says what it is waiting for, then navigates to the PDF's blob URL.
 * The API needs a bearer token, so the tab cannot simply load the API URL.
 */
export async function printExport(claimId: string): Promise<void> {
  const tab = window.open('', '_blank')
  if (tab) {
    tab.opener = null
    tab.document.title = 'Preparing PDF…'
    tab.document.body.style.cssText = 'font:14px system-ui,sans-serif;color:#555;padding:32px'
    tab.document.body.textContent = 'Preparing the inventory PDF…'
  }
  let blob: Blob
  try {
    ;({ blob } = await fetchBinary(`/v1/claims/${encodeURIComponent(claimId)}/export?format=pdf`))
  } catch (error) {
    tab?.close()
    throw error
  }
  const url = URL.createObjectURL(blob)
  if (tab && !tab.closed) {
    tab.location.href = url
  } else if (!window.open(url, '_blank')) {
    URL.revokeObjectURL(url)
    throw new Error('Your browser blocked the new tab. Allow pop-ups for kevin.co and try again.')
  }
  // The viewer reads the blob when it loads; keep it alive long enough for a
  // reload or a Save from the viewer, then let it go.
  window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000)
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
