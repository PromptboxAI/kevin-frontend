/**
 * What the deferred bar says, from `GET /v1/deferred` (backend 177d9d9).
 *
 * Import-free so it runs under node for the tests. The query lives in
 * lib/deferred.ts; this decides only the words.
 *
 * The endpoint exists because pricing self-heals and a deferred LINE does not:
 * the breaker reopens on its own, but a row that already deferred stays
 * unpriced until a human presses Retry deferred. This module's whole job is to
 * say when pressing it is worth anything.
 *
 * THREE RULES FROM THE CONTRACT, all load-bearing:
 *  - `counts` is per reason and is NEVER summed here. The reasons clear on
 *    different clocks (budget at the next UTC midnight, a quota inside the
 *    hour, an outage whenever the provider recovers), so one merged number
 *    would tell an adjuster work is retryable now when it isn't. The headline
 *    number is the SERVER's `total`, which is also exactly what the retry
 *    button re-runs -- never a client-side addition of the counts.
 *  - `pricing` is embedded on purpose: it is the same block `/v1/status`
 *    returns, delivered in the same round trip so the banner and the button
 *    beside it cannot disagree. Never fetch both and merge.
 *  - Only the capacity reasons appear -- the same set the retry endpoint acts
 *    on. Judged reasons (no_comps, low_sample…) are excluded by the server, so
 *    a number here is always a number that can actually re-run.
 */

export type DeferredClaim = {
  claim_id: string
  /** May be null: an unnamed claim still counts. */
  name: string | null
  /** Every stranded line, including ones Retry will skip. */
  total: number
  /**
   * What Retry deferred will actually enqueue: `total` minus the rows with
   * neither a query nor a description, which the retry skips as
   * `no_query_or_description`. Absent on a backend before it shipped.
   */
  actionable?: number
  /** Per reason, over the ACTIONABLE rows: these foot to `actionable`. */
  counts: Record<string, number>
  /**
   * Rows with neither a query nor a description. No retry will ever price
   * them -- someone has to type a description -- so they get their own line,
   * never folded into the deferred count. `actionable + needs_description`
   * foots to `total`.
   */
  needs_description?: number
}

export type DeferredReport = {
  pricing: {
    state: string
    reason: string | null
    since: string | null
    next_check_at: string | null
  }
  total: number
  /** Cross-claim `actionable`, same meaning as on a claim. */
  actionable?: number
  needs_description?: number
  /** Most-ACTIONABLE first: the claim where Retry does the most good leads. */
  claims: DeferredClaim[]
  updated_at: string
}

/**
 * The number to render: what the button will re-run. `actionable` once the
 * backend sends it, `total` before -- never a sum of `counts`.
 */
export function retryable(x: { total: number; actionable?: number }): number {
  return typeof x.actionable === 'number' ? x.actionable : x.total
}

/**
 * Reason -> what happened, and what has to happen before a retry prices it.
 * The clock is the point: it is the difference between "press this now" and
 * "press this tomorrow".
 */
const REASON_COPY: Record<string, { what: string; clears: string }> = {
  vendor_unavailable: {
    what: 'a provider outage',
    clears: 'once the search provider recovers',
  },
  quota_exhausted: {
    what: 'a search limit',
    clears: 'within the hour',
  },
  budget_exhausted: {
    what: 'today’s pricing capacity',
    clears: 'after midnight UTC',
  },
  not_priced: {
    what: 'never reaching pricing',
    clears: 'as soon as you retry',
  },
  enqueue_failed: {
    what: 'never reaching the pricing queue',
    clears: 'as soon as you retry',
  },
}

/** Slowest clock first, so the line that gates the claim reads first. */
const REASON_ORDER = [
  'vendor_unavailable',
  'budget_exhausted',
  'quota_exhausted',
  'enqueue_failed',
  'not_priced',
]

export type ReasonLine = { reason: string; count: number; text: string }

function isReport(value: unknown): value is DeferredReport {
  if (!value || typeof value !== 'object') return false
  const v = value as { total?: unknown; claims?: unknown }
  return typeof v.total === 'number' && Array.isArray(v.claims)
}

/** The pricing block the report carries. Null when the read failed. */
export function pricingState(report: unknown): string | null {
  if (!isReport(report)) return null
  const pricing = (report as DeferredReport).pricing
  if (!pricing || typeof pricing.state !== 'string') return null
  return pricing.state
}

/** Rows only a typed description can unstick. 0 on an older payload. */
export function undescribed(x: { needs_description?: number }): number {
  return typeof x.needs_description === 'number' && x.needs_description > 0
    ? x.needs_description
    : 0
}

/** "3 lines need a description before they can be priced." */
export function describeLine(n: number): string | null {
  if (n <= 0) return null
  return `${n} line${n === 1 ? ' needs' : 's need'} a description before ${n === 1 ? 'it' : 'they'} can be priced.`
}

/** This claim's entry, or null -- `total: 0, claims: []` is the clean answer. */
export function deferredFor(report: unknown, claimId: string): DeferredClaim | null {
  if (!isReport(report) || !claimId) return null
  for (const claim of report.claims) {
    if (!claim || typeof claim !== 'object') continue
    if (claim.claim_id !== claimId) continue
    // Kept while EITHER line has something to say: a claim of only
    // undescribed rows has no retry to offer but still has work waiting.
    if (typeof claim.total !== 'number') return null
    if (retryable(claim) <= 0 && undescribed(claim) <= 0) return null
    return claim
  }
  return null
}

/**
 * One line per reason, in clock order, counts left exactly as they arrived.
 * An unrecognised reason still prints its count -- the server only sends
 * retryable ones, so dropping it would understate the work.
 */
export function reasonLines(counts: Record<string, number> | undefined): ReasonLine[] {
  if (!counts || typeof counts !== 'object') return []
  const seen = Object.keys(counts).filter((k) => typeof counts[k] === 'number' && counts[k] > 0)
  const ordered = [
    ...REASON_ORDER.filter((r) => seen.includes(r)),
    ...seen.filter((r) => !REASON_ORDER.includes(r)).sort(),
  ]
  return ordered.map((reason) => {
    const copy = REASON_COPY[reason]
    const count = counts[reason]
    return {
      reason,
      count,
      text: copy
        ? `${count} by ${copy.what}, ${copy.clears}`
        : `${count} paused, once pricing is available again`,
    }
  })
}

export type RetryCall = {
  /** The button's words. */
  label: string
  /** Why pressing it now is pointless, or null when it isn't. */
  hint: string | null
  /** True while pricing is stopped: the call to action steps back a shade. */
  soften: boolean
}

/**
 * The button, read against live pricing.
 *
 * While pricing is PAUSED a retry re-runs the lines straight back into the
 * same closed door and defers them again -- it spends nothing (the searches
 * never happen) but it looks like a failure. So the ask softens and says why.
 * `degraded` is NOT paused: searches answer, slowly, so a retry works and the
 * button stays plain.
 */
export function retryCall(state: string | null, total: number): RetryCall {
  if (state === 'paused') {
    return {
      label: `Retry ${total} anyway`,
      hint: 'Pricing is paused right now, so these would defer again — worth waiting until it resumes.',
      soften: true,
    }
  }
  return { label: `Retry ${total} deferred`, hint: null, soften: false }
}

export type RosterSummary = {
  /** The SERVER's cross-claim retryable count. */
  total: number
  /** How many claims have something Retry can re-run. */
  claims: number
  /** The claim to open: first in the server's most-actionable-first order. */
  lead: DeferredClaim
  text: string
}

/**
 * The roster cue: the claims list is where an adjuster decides what to open,
 * and a claim whose lines are stranded looks finished from there.
 *
 * `claims` arrives most-actionable-first, so the lead is simply the first
 * claim with something to retry. When nothing is retryable but rows need a
 * description, the lead is the first claim carrying those instead.
 */
export function rosterSummary(report: unknown): RosterSummary | null {
  if (!isReport(report)) return null
  const valid = report.claims.filter(
    (c) => c && typeof c === 'object' && typeof c.total === 'number',
  )
  const retry = valid.filter((c) => retryable(c) > 0)
  const total = retryable(report)
  const typing = undescribed(report)
  const more =
    typing > 0
      ? ` ${typing} more ${typing === 1 ? 'needs' : 'need'} a description before ${typing === 1 ? 'it' : 'they'} can be priced.`
      : ''

  if (total > 0 && retry.length > 0) {
    const lead = retry[0]
    const name = lead.name?.trim() || lead.claim_id
    const lines = `${total} line${total === 1 ? '' : 's'}`
    const text =
      retry.length === 1
        ? `${lines} on ${name} ${total === 1 ? 'is' : 'are'} waiting on a retry — pricing was paused, not a problem with the items.${more}`
        : `${lines} across ${retry.length} claims are waiting on a retry — ${name} has the most (${retryable(lead)}).${more}`
    return { total, claims: retry.length, lead, text }
  }

  const lead = valid.find((c) => undescribed(c) > 0)
  if (typing > 0 && lead) {
    const name = lead.name?.trim() || lead.claim_id
    const own = undescribed(lead)
    const text =
      own === typing
        ? `${typing} line${typing === 1 ? '' : 's'} on ${name} ${typing === 1 ? 'needs' : 'need'} a description before ${typing === 1 ? 'it' : 'they'} can be priced.`
        : `${describeLine(typing)!.replace(/\.$/, '')}, across your claims — ${name} has ${own}.`
    return { total: 0, claims: 0, lead, text }
  }
  return null
}
