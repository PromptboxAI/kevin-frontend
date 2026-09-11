/**
 * The home-page demo's API client — `POST /v1/demo/drops` and its poll.
 *
 * Contract: kevin-backend/FRONTEND.md, "Home-page demo — drop a photo, see it
 * priced" (2026-09-11). The shapes and the reason codes below are that table,
 * not a paraphrase of it.
 *
 * TWO THINGS THE COPY MUST NEVER SAY, both from the contract:
 *   - it does NOT assess damage. The engine identifies the item and prices its
 *     REPLACEMENT. "Analyzing image damage…" promises something the product
 *     does not do.
 *   - `not_priced` is NOT an error. Each reason gets its own sentence, and
 *     none of them is a failure page -- "no single household item in the
 *     frame" is the engine working correctly.
 */
import { API_BASE_URL, TURNSTILE_SITE_KEY } from './env'

/* ── the contract ─────────────────────────────────────────────────────── */

export type DropStage = 'queued' | 'identifying' | 'pricing' | 'done' | 'not_priced' | 'failed'

/** Set from `pricing` onward — show it before the price arrives. */
export type DropIdentified = {
  description: string
  make: string | null
  model: string | null
  category: string | null
  pcs_code: string | null
}

/** Present on `done`. Replacement cost NEW, pre-tax; no age, no ACV. */
export type DropResult = {
  rcv: number
  source_link: string | null
  source_name: string | null
  comp_count: number | null
  basis: string | null
}

export type NotPricedReason =
  | 'not_an_item'
  | 'needs_adjuster'
  | 'no_price'
  | 'budget_paused'
  | 'unavailable'

export type Drop = {
  drop_id: string
  stage: DropStage
  identified: DropIdentified | null
  result: DropResult | null
  reason: NotPricedReason | null
  cached: boolean
}

/** Why the drop could not even start. Each has its own copy; none is a crash. */
export type DropRefusal =
  | { kind: 'not_configured' }
  | { kind: 'turnstile' }
  | { kind: 'too_large' }
  | { kind: 'not_a_photo' }
  | { kind: 'rate_limited'; retryAfter: number | null }
  | { kind: 'capacity'; retryAfter: number | null }
  | { kind: 'network' }

export class DropRefused extends Error {
  refusal: DropRefusal
  constructor(refusal: DropRefusal) {
    super(refusal.kind)
    this.refusal = refusal
  }
}

/** The widget cannot render without a site key, and every drop needs a token. */
export const demoConfigured = () => Boolean(TURNSTILE_SITE_KEY)

const retryAfter = (res: Response) => {
  const raw = res.headers.get('Retry-After')
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : null
}

/** Terminal stages — stop polling. */
export const isTerminal = (s: DropStage) => s === 'done' || s === 'not_priced' || s === 'failed'

export async function createDrop(file: File, turnstileToken: string): Promise<Drop> {
  const body = new FormData()
  // `image`, not `photo` -- the field name is the contract's.
  body.append('image', file)
  body.append('turnstile_token', turnstileToken)

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/v1/demo/drops`, { method: 'POST', body })
  } catch {
    throw new DropRefused({ kind: 'network' })
  }

  // 202 = running (poll). 200 = a preset or a photo already seen, answered
  // from cache: instant, free, and not counted against the visitor.
  if (res.status === 202 || res.ok) return (await res.json()) as Drop

  if (res.status === 403) throw new DropRefused({ kind: 'turnstile' })
  if (res.status === 413) throw new DropRefused({ kind: 'too_large' })
  if (res.status === 415 || res.status === 400) throw new DropRefused({ kind: 'not_a_photo' })
  if (res.status === 429)
    throw new DropRefused({ kind: 'rate_limited', retryAfter: retryAfter(res) })
  // 503 covers three states -- off, at today's capacity, or busy. All three
  // mean the same thing to a visitor: not now, try a sample.
  if (res.status === 503) throw new DropRefused({ kind: 'capacity', retryAfter: retryAfter(res) })
  throw new DropRefused({ kind: 'network' })
}

export async function pollDrop(dropId: string): Promise<Drop> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/v1/demo/drops/${encodeURIComponent(dropId)}`)
  } catch {
    throw new DropRefused({ kind: 'network' })
  }
  // A drop expires an hour after it was made; nobody is watching one that
  // long, but a backgrounded tab can come back to a 404.
  if (res.status === 404) throw new DropRefused({ kind: 'capacity', retryAfter: null })
  if (!res.ok) throw new DropRefused({ kind: 'network' })
  return (await res.json()) as Drop
}

/* ── depreciation, via the product's own endpoint ─────────────────────── */

export type PreviewMoney = {
  tax: number | null
  ext_cost: number
  rcv_total_incl: number
  depreciation_pct: number
  depreciation_amount: number
  acv_total_incl: number
  depreciation_capped: boolean
}

/**
 * The age slider. Public, no write, and the SAME endpoint the worksheet uses,
 * so the demo cannot disagree with the product about depreciation.
 *
 * `tax` comes back null here: a visitor has no loss address, so there is no
 * jurisdiction to resolve a rate from. The figures are pre-tax and the card
 * says so rather than printing a tax line nobody chose.
 */
export async function previewDepreciation(
  rcv: number,
  ageYears: number,
  category: string | null,
): Promise<PreviewMoney> {
  const qs = new URLSearchParams({ rcv: String(rcv), age_years: String(ageYears) })
  if (category) qs.set('category', category)
  const res = await fetch(`${API_BASE_URL}/v1/worksheet/preview?${qs.toString()}`)
  if (!res.ok) throw new Error(`preview ${res.status}`)
  return (await res.json()) as PreviewMoney
}
