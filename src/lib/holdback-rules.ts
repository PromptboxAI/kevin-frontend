/**
 * Holdback recovery, as far as the FRONTEND is allowed to reason about it.
 *
 * The math is the server's and stays there:
 *
 *   recoverable = max(0, min(rcv_total_incl, claimed_rcv) - acv_total_incl)
 *
 * with a partial-quantity ratio when only some units were replaced. This module
 * computes NO money. It answers one question the UI does need to answer before
 * a write: is what the adjuster typed going to produce a truthful number?
 *
 * Import-free so it can be unit-tested.
 */

export type HoldbackInput = {
  /** What the insured actually spent replacing the item. */
  claimedRcv: number | null
  /** How many units they replaced. */
  replacedQty: number | null
  /** How many the line schedules. */
  quantity: number
}

export type HoldbackWarning =
  | 'amount_without_count'
  | 'count_without_amount'
  | 'count_exceeds_quantity'
  | null

/**
 * The one that matters.
 *
 * From the backend's own note: "a receipt for four of six chairs entered
 * WITHOUT the count computes $0 recoverable on money genuinely owed." The
 * ratio defaults in a way that silently zeroes the line, so an amount with no
 * count is not a small omission -- it is money quietly not asked for, on the
 * screen whose whole purpose is asking for it.
 */
export function holdbackWarning(input: HoldbackInput): HoldbackWarning {
  const hasAmount = input.claimedRcv !== null && input.claimedRcv > 0
  const hasCount = input.replacedQty !== null && input.replacedQty > 0

  if (hasAmount && !hasCount) return 'amount_without_count'
  if (hasCount && !hasAmount) return 'count_without_amount'
  if (hasCount && input.replacedQty! > input.quantity) return 'count_exceeds_quantity'
  return null
}

export const HOLDBACK_WARNING_COPY: Record<Exclude<HoldbackWarning, null>, string> = {
  amount_without_count:
    'Say how many units were replaced. Without a count this line recovers $0, even though the money was spent.',
  count_without_amount: 'Add what was actually spent, or this line recovers nothing.',
  count_exceeds_quantity:
    'More units replaced than this line schedules. Check the count, or split the line.',
}

/**
 * A sensible default for the count.
 *
 * Most replacements are like-for-like, so pre-filling the line's own quantity
 * makes the common case one field instead of two -- and, more importantly,
 * makes the zero-recovery trap impossible to fall into by omission.
 */
export function defaultReplacedQty(quantity: number | null | undefined): number {
  const n = Number(quantity)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1
}

/** Money as typed by an adjuster: "$1,899.00" or "1899". Null means cleared. */
export function parseClaimed(input: string): { ok: true; value: number | null } | { ok: false } {
  const text = input.trim().replace(/[$,\s]/g, '')
  if (text === '') return { ok: true, value: null }
  const value = Number(text)
  if (!Number.isFinite(value) || value < 0) return { ok: false }
  return { ok: true, value: Math.round(value * 100) / 100 }
}

export function parseQty(input: string): { ok: true; value: number | null } | { ok: false } {
  const text = input.trim()
  if (text === '') return { ok: true, value: null }
  const value = Number(text)
  if (!Number.isInteger(value) || value < 0) return { ok: false }
  return { ok: true, value }
}

/**
 * Is this claim at the stage where holdback recovery applies?
 *
 * Post-settlement by definition: the carrier has paid ACV and withheld
 * depreciation, and this is the ask to release it. Showing these fields during
 * the estimating pass invites receipts attached before anyone has been paid.
 */
export function holdbackApplies(claimStatus: string | undefined): boolean {
  return claimStatus === 'closed' || claimStatus === 'archived'
}
