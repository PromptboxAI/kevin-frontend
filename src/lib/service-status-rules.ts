/**
 * What the site-wide pricing banner says, from `GET /v1/status`.
 *
 * Import-free so it runs under node for the tests. The hook and component live
 * in components/ServiceStatusBanner.tsx; this decides only the words.
 *
 * Contract (FRONTEND.md "Service status banner", backend 0fe58d9):
 *   pricing.state   ok | paused
 *   pricing.reason  vendor_outage | budget | null   (budget wins if both)
 *   pricing.next_check_at  next recovery probe (outage) / next UTC midnight (budget)
 * The hourly throughput ceiling is never reported as a pause.
 *
 * TWO THINGS THE COPY MUST NOT CLAIM:
 *  - That deferred lines "resume automatically". Pricing resumes on its own,
 *    but a line deferred DURING the pause needs Retry deferred on its claim.
 *    Promising otherwise leaves an adjuster waiting on lines that never price.
 *  - A vendor's name. The status payload never carries one, and neither does
 *    anything a customer reads.
 * And it never shows on a malformed or failed status read: no answer is not
 * an outage.
 */

export type ServiceStatus = {
  pricing: {
    state: string
    reason: string | null
    since: string | null
    next_check_at: string | null
  }
  updated_at: string
}

export type StatusBanner = {
  /** The headline, bold. */
  message: string
  /** What still works and what the adjuster should do. */
  detail: string
  /**
   * `paused` = nothing is pricing (the accent bar). `degraded` = pricing is
   * RUNNING on an impaired provider, so it must not wear the paused styling or
   * an adjuster stops working for no reason.
   */
  tone: 'paused' | 'degraded'
}

/** Everything else keeps working during either pause (FRONTEND.md). */
const STILL_WORKS = 'Uploads, edits and exports still work.'
const RETRY = 'Lines added meanwhile are held, not lost; once pricing resumes, use Retry deferred on the claim to price them.'

function isServiceStatus(value: unknown): value is ServiceStatus {
  if (!value || typeof value !== 'object') return false
  const pricing = (value as { pricing?: unknown }).pricing
  return !!pricing && typeof pricing === 'object' && typeof (pricing as { state?: unknown }).state === 'string'
}

export function bannerFor(status: unknown, formatTime: (iso: string) => string): StatusBanner | null {
  if (!isServiceStatus(status)) return null
  const { state, reason, next_check_at: next } = status.pricing

  /**
   * `degraded` (backend, 2026-09-16): the provider publicly reports a
   * component we price with as impaired, but our own searches still answer.
   * Pricing RUNS -- so this says so, and never borrows the pause's words or
   * colour. Precedence is the server's (budget > paused > degraded > ok); the
   * payload carries one state and this renders it.
   */
  if (state === 'degraded') {
    return {
      message: 'Search provider reporting degraded service.',
      detail: 'Pricing is still running; results may be thinner than usual. Nothing needs doing.',
      tone: 'degraded',
    }
  }

  // Any OTHER unknown state shows nothing. Never assume a new state means
  // paused: telling adjusters pricing stopped while it runs is worse than
  // silence, and silence is what a build predating the state already does.
  if (state !== 'paused') return null

  if (reason === 'budget') {
    let when = 'at midnight UTC'
    if (next) {
      const t = Date.parse(next)
      if (!Number.isNaN(t)) when = `at ${formatTime(next)}`
    }
    return {
      message: `Pricing paused until ${when.replace(/^at /, '')}: today’s pricing capacity is used up.`,
      detail: `${STILL_WORKS} ${RETRY}`,
      tone: 'paused',
    }
  }

  if (reason === 'vendor_outage') {
    return {
      message: 'Pricing temporarily paused: search provider outage.',
      detail: `${STILL_WORKS} Kevin keeps checking and resumes pricing as soon as it recovers. ${RETRY}`,
      tone: 'paused',
    }
  }

  // A reason this build does not know yet: still a pause, stated plainly.
  return {
    message: 'Pricing temporarily paused.',
    detail: `${STILL_WORKS} ${RETRY}`,
    tone: 'paused',
  }
}
