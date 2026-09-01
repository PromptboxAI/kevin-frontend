/**
 * The adjuster overriding the depreciation rate by hand.
 *
 * An item is a year old and the class table says 20%, but it came out of a
 * flooded basement, so the adjuster takes 55%. This module decides what to SEND
 * for that; it computes no money. `depreciation_amount` and `acv_total_incl`
 * come back from the server and are applied verbatim -- `computeACV()` was
 * deleted from this codebase precisely because a client-side rounding
 * disagreement makes the worksheet contradict the exported PDF.
 *
 * Import-free so it can be tested.
 */

/** What the adjuster typed, resolved. `null` fraction means "clear the lock". */
export type DeprEntry =
  | { ok: true; fraction: number | null }
  | { ok: false; reason: 'not_a_number' | 'out_of_range' }

/**
 * Parse the % Depr. cell.
 *
 * The column is a PERCENT and the input is read as one, always. This is the
 * single most dangerous conversion on the screen: the API takes a FRACTION
 * (0..1), so a `55` passed through unconverted is 5500% -- which the backend
 * rejects with a 422, but a `0.55` typed by an adjuster who thinks in fractions
 * would be silently accepted as 0.55%, quietly under-depreciating the line by
 * two orders of magnitude. So there is no cleverness here: what you type is
 * percent, and 0.55 means 0.55%.
 *
 * An EMPTY cell is not an error and not zero -- it is the request to drop the
 * override and go back to the schedule. Zero is a real, different answer
 * ("this item has not depreciated"), and it stays available by typing 0.
 */
export function parseDeprPercent(input: string): DeprEntry {
  const text = input.trim().replace(/%/g, '').replace(/,/g, '').trim()
  if (text === '') return { ok: true, fraction: null }

  const percent = Number(text)
  if (!Number.isFinite(percent)) return { ok: false, reason: 'not_a_number' }
  if (percent < 0 || percent > 100) return { ok: false, reason: 'out_of_range' }

  // toFixed before Number to keep 7% off 0.07000000000000001.
  return { ok: true, fraction: Number((percent / 100).toFixed(6)) }
}

export const DEPR_ERROR_COPY: Record<'not_a_number' | 'out_of_range', string> = {
  not_a_number: 'Enter a depreciation percentage, or clear the cell to go back to the schedule.',
  out_of_range:
    'Depreciation is a percentage between 0 and 100. Enter 55 for 55%, not 0.55.',
}

/**
 * The default schedule to return to when the override is released.
 *
 * Straight-line, per the product's stated default. Releasing the lock has to
 * NAME a method: the contract is explicit that sending `custom` without a rate
 * keeps the existing one, so there is no "just unset it" — only a switch back
 * to a table. Nothing on the claim records which table it was before the
 * override, so the documented default is the honest choice.
 */
export const DEFAULT_METHOD = 'straight_line' as const

export type DeprOverrideBody =
  | { dep_manual: number }
  | { depreciation_method: typeof DEFAULT_METHOD }

/**
 * What to PATCH for this entry.
 *
 * Setting a rate sends `dep_manual` alone -- supplying it flips
 * `depreciation_method` to `custom` server-side, so sending both is redundant
 * and invites the two disagreeing.
 */
export function deprOverrideBody(fraction: number | null): DeprOverrideBody {
  return fraction === null ? { depreciation_method: DEFAULT_METHOD } : { dep_manual: fraction }
}

export type DeprRow = {
  depreciation_pct: number | null
  depreciation_method: string | null
  status: string
}

/** The adjuster's rate is locked on this line. */
export function isManualDepr(row: DeprRow): boolean {
  return row.depreciation_method === 'custom'
}

/**
 * Is this entry worth a write?
 *
 * Two no-ops to catch, because both cost a round trip AND an audit event that
 * says nothing happened:
 *
 *   - the same rate re-entered (tabbing through the column commits every cell)
 *   - a clear on a line that was never overridden
 *
 * The rate comparison is at the fraction's own precision. `depreciation_pct`
 * comes back rounded server-side, so comparing raw floats would treat 0.55 and
 * 0.5500000001 as a change and write on every tab-through.
 */
export function deprChanged(row: DeprRow, fraction: number | null): boolean {
  if (fraction === null) return isManualDepr(row)
  if (row.depreciation_pct === null) return true
  return Math.abs(row.depreciation_pct - fraction) > 1e-6
}

/**
 * Can this line take a rate at all?
 *
 * An unpriced line has no replacement cost to depreciate — 55% of nothing is
 * nothing — so the contract requires a price first. Same gate as Age.
 */
export function deprEditable(row: DeprRow): boolean {
  return row.status !== 'needs_manual'
}

/** The cell's text, as a percent, for editing. Empty when the row has no rate. */
export function deprCellValue(pct: number | null): string {
  if (pct === null) return ''
  // 0.305 -> "30.5", 0.3 -> "30". Trailing zeros are noise in an input.
  return String(Number((pct * 100).toFixed(4)))
}
