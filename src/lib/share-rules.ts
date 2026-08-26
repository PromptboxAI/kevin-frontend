/**
 * Share lifecycle rules, deliberately free of any import so they can be
 * unit-tested in node -- the same shape as staging-rules.ts.
 */
import type { ShareSummary } from './shares'

/**
 * The lifecycle as one word, for a badge.
 *
 * Order matters: a revoked link is revoked whatever else happened to it, and a
 * delivery failure outranks the payment that preceded it because it is the
 * state someone has to act on.
 */
export type ShareState = 'revoked' | 'expired' | 'delivery_failed' | 'delivered' | 'paid' | 'live'

export function shareState(s: ShareSummary): ShareState {
  if (s.revoked_at) return 'revoked'
  if (!s.active) return 'expired'
  if (s.delivery_error) return 'delivery_failed'
  if (s.delivered_at) return 'delivered'
  if (s.paid_at) return 'paid'
  return 'live'
}

export const SHARE_STATE_LABEL: Record<ShareState, string> = {
  revoked: 'Revoked',
  expired: 'Expired',
  delivery_failed: 'Delivery failed',
  delivered: 'Delivered',
  paid: 'Paid',
  live: 'Active',
}

export const SHARE_STATE_TONE: Record<ShareState, 'ok' | 'warn' | 'quiet' | 'accent'> = {
  revoked: 'quiet',
  expired: 'quiet',
  delivery_failed: 'warn',
  delivered: 'ok',
  paid: 'ok',
  live: 'accent',
}

/**
 * Substantiation, counted the way the DOCUMENT counts it.
 *
 * `source_link` is the same derivation the portal and the .xlsx use, so a
 * warning built on it quotes a number the document honours. Counting
 * `manual_source_url` instead would drift from what is actually delivered.
 *
 * Unpriced lines are excluded: a line with no price has nothing to substantiate
 * yet, and folding it in would inflate the warning with rows the adjuster has
 * not reached.
 */
export function countUnsubstantiated(
  items: { rcv: number | null; source_link?: string | null }[],
): { priced: number; missing: number } {
  const priced = items.filter((i) => i.rcv != null)
  return {
    priced: priced.length,
    missing: priced.filter((i) => !i.source_link).length,
  }
}
