/**
 * Pure derivations for the admin Accounts screens. Import-free on purpose, so
 * it compiles and runs standalone under node for its tests.
 *
 * Everything here turns ONE account row into something displayable. Nothing
 * here invents a number: if the server did not say it, these return null and
 * the screen renders a dash. The back office is the one surface whose whole
 * job is to tell you the truth about the system, so a plausible guess is worse
 * than a blank.
 */

/** Exactly the row GET /v1/admin/accounts returns (prompt 4 §4.1). */
export type AdminAccount = {
  user_id: string
  email: string
  plan: string
  billing_state: string
  included_items: number | null
  items_used: number | null
  credit_balance: number | null
  claims_count: number | null
  photos_count: number | null
  storage_bytes: number | null
  created_at: string | null
  last_active_at: string | null
}

export type AdminAccountsResponse = {
  accounts: AdminAccount[]
  /**
   * The total across ALL pages — confirmed by the backend 2026-10-05.
   *
   * Worth the confirmation rather than the assumption: `/v1/jobs/failed`
   * returns a `count` that means THIS PAGE, and the System screen once read it
   * as a total and reported "50 failed jobs" when there were 79 (see
   * FAILED_JOBS_LIMIT in admin.ts). Same word, different meaning, one API.
   */
  count?: number | null
  /**
   * Being added by the backend with the same value as `count`, expressly so
   * nobody has to trust the name. Preferred when present.
   */
  total?: number | null
}

/**
 * PLAN SIZES THE ALLOWANCE, BILLING STATE SAYS WHETHER MONEY MOVES.
 *
 * They are independent columns and live data holds accounts at
 * `plan: "pro", billing_state: "trial"` (rule 9b, backend 2026-10-03). Reading
 * the state to size the pool would show those a 250 lifetime pool while the
 * engine hands them 2,000 a month. So: allowance questions read `plan`, money
 * questions read `billing_state`, and nothing reads one for the other.
 */
export const BILLING_STATES = ['trial', 'active', 'past_due', 'canceled', 'comped', 'internal'] as const

/**
 * Accounts that are NOT paying and must never reach a revenue rollup.
 * Comped (we gave it away) and internal (our own staff) both carry $0 by
 * design -- see rule 9 and the admin console notes. Excluded here by naming
 * the states rather than by a filter each caller remembers to apply.
 */
export function isNonBilling(billingState: string | null | undefined): boolean {
  const s = (billingState ?? '').toLowerCase()
  return s === 'comped' || s === 'internal'
}

/**
 * Badge tone for a billing state, in the four tones `Badge` actually has.
 *
 * `past_due` takes `warn` because it is the only state that is a PROBLEM, and
 * warn is the strongest tone available -- there is no danger badge, and adding
 * one would mean a new colour outside the token set. The severity is carried
 * in words anyway: `accountFlags` puts a red "Payment failed" under the email.
 *
 * A trial is NOT a warning, so it takes `accent` (navy) rather than amber.
 * Amber is rule 6's colour and the fewer things wearing it the better.
 */
export function stateTone(billingState: string | null | undefined): 'ok' | 'warn' | 'quiet' | 'accent' {
  switch ((billingState ?? '').toLowerCase()) {
    case 'active':
      return 'ok'
    case 'past_due':
      return 'warn'
    case 'trial':
      return 'accent'
    case 'comped':
    case 'internal':
      return 'quiet'
    default:
      return 'quiet'
  }
}

/** Human label for a billing state, without inventing states we do not know. */
export function stateLabel(billingState: string | null | undefined): string {
  const s = (billingState ?? '').trim()
  if (!s) return 'Unknown'
  if (s.toLowerCase() === 'past_due') return 'Past due'
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function planLabel(plan: string | null | undefined): string {
  const p = (plan ?? '').trim()
  if (!p) return 'Unknown'
  if (p.toLowerCase() === 'pro') return 'Pro'
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

/**
 * THE TRIAL IS A LIFETIME POOL, NOT A MONTHLY ALLOWANCE (rule 9b, amended
 * 2026-10-02). A trial ends when the 250th item is produced and at no other
 * moment, so this must never render "a month" beside it and no caller may put
 * a renewal date next to it.
 *
 * Keyed off PLAN, per the note at the top of this file.
 */
export function allowancePeriod(plan: string | null | undefined): 'lifetime' | 'monthly' {
  return (plan ?? '').toLowerCase() === 'trial' ? 'lifetime' : 'monthly'
}

export function allowanceLabel(plan: string | null | undefined): string {
  return allowancePeriod(plan) === 'lifetime' ? 'lifetime' : 'this month'
}

/**
 * Items left, counting the cycle allowance FIRST and credits only after it is
 * empty -- the order `consume()` uses on the server. Returns null when the
 * server did not say, because "0 remaining" and "we do not know" are very
 * different things to show next to a suspended account.
 */
export function itemsRemaining(a: Pick<AdminAccount, 'included_items' | 'items_used' | 'credit_balance'>): number | null {
  if (a.included_items == null || a.items_used == null) return null
  const credits = a.credit_balance ?? 0
  return Math.max(a.included_items + credits - a.items_used, 0)
}

/**
 * How full the cycle allowance is, 0..1, for the meter. Credits are NOT in the
 * denominator: they are a separate pool bought separately, and folding them in
 * would make a bar jump backwards the moment someone buys some.
 */
export function usageFraction(a: Pick<AdminAccount, 'included_items' | 'items_used'>): number | null {
  if (a.included_items == null || a.items_used == null || a.included_items <= 0) return null
  return Math.min(a.items_used / a.included_items, 1)
}

/** Over the included allowance and into credits (or into a 402). */
export function isOverAllowance(a: Pick<AdminAccount, 'included_items' | 'items_used'>): boolean {
  if (a.included_items == null || a.items_used == null) return false
  return a.items_used > a.included_items
}

/**
 * Bytes to a short human string. Binary units, because that is what storage
 * accounting uses and what `storage_bytes` counts.
 */
export function fmtBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—'
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  const dp = v < 10 && i > 0 ? 1 : 0
  return `${v.toFixed(dp)} ${units[i]}`
}

/**
 * "3 days ago" for a timestamp, or null when there is none. Deliberately
 * coarse: an exact clock time implies a precision that `last_active_at`
 * does not have, and nobody triages on seconds.
 */
export function sinceLabel(iso: string | null | undefined, now: Date = new Date()): string | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  const mins = Math.floor((now.getTime() - t) / 60000)
  if (mins < 0) return 'just now'
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/**
 * What needs attention about an account, most serious first. Drives the one
 * line under the email in the table, so an owner scanning the list sees the
 * problem before clicking.
 *
 * Only states the server told us about. No "inactive for 90 days" style
 * inferences -- those are a product decision nobody has made.
 */
export function accountFlags(a: AdminAccount): string[] {
  const out: string[] = []
  if ((a.billing_state ?? '').toLowerCase() === 'past_due') out.push('Payment failed')
  if (isOverAllowance(a)) {
    const over = (a.items_used ?? 0) - (a.included_items ?? 0)
    const credits = a.credit_balance ?? 0
    out.push(over > credits ? 'Out of items' : 'Using credits')
  }
  return out
}

/**
 * Search is server-side (`?q=`), but the field is debounced and the table
 * keeps showing the previous page meanwhile. This says whether a query is
 * worth sending: one character matches most of the table and costs a round
 * trip to say so.
 */
export function shouldSearch(q: string): boolean {
  return q.trim().length === 0 || q.trim().length >= 2
}

/** `?q=&limit=&offset=` for the accounts list, omitting what is empty. */
export function accountsQuery(opts: { q?: string; limit?: number; offset?: number }): string {
  const p = new URLSearchParams()
  const q = (opts.q ?? '').trim()
  if (q) p.set('q', q)
  if (opts.limit != null) p.set('limit', String(opts.limit))
  if (opts.offset) p.set('offset', String(opts.offset))
  const s = p.toString()
  return s ? `?${s}` : ''
}

/**
 * How many accounts there are in all, from whichever field carries it.
 * `total` is authoritative when present; `count` is the same number under an
 * ambiguous name (backend, 2026-10-05). Null when neither was sent, and the
 * caller falls back to the page heuristic rather than inventing a figure.
 */
export function totalFrom(r: Pick<AdminAccountsResponse, 'count' | 'total'> | undefined): number | null {
  if (!r) return null
  if (r.total != null) return r.total
  if (r.count != null) return r.count
  return null
}

/**
 * Paging. Uses the total when there is one and falls back to "was the page
 * full?" when there is not -- paging on a null total stops at the first page
 * and silently hides the rest, which is the failure this shape exists to
 * avoid. The fallback only ever costs one extra request at the end.
 */
export function nextOffset(opts: {
  offset: number
  limit: number
  returned: number
  total?: number | null
}): number | null {
  const { offset, limit, returned, total } = opts
  const next = offset + returned
  if (total != null) return next < total ? next : null
  if (returned === 0) return null
  return returned === limit ? next : null
}
