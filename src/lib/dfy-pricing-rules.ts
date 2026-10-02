/**
 * Done-for-you pricing. One implementation, no React, no fetch.
 *
 * This exists so the published table, the quote a client is shown, and the
 * invoice that follows can never disagree. The rates were a hand-written array
 * beside hand-written worked examples, which is how the previous scheme ended
 * up with a table whose own example contradicted it.
 *
 * ⛔ MARGINAL, NOT FLAT PER TIER (owner, 2026-10-02). Each band prices only the
 * lines inside it. The scheme it replaced picked ONE rate by line count and
 * applied it to every line, which made the invoice fall at every boundary: 800
 * lines billed $2,800 and 801 billed $2,002.50. `totalForLines` is monotonic by
 * construction and a test asserts it for every count up to the custom band.
 *
 * ⛔ THE UNIT IS A COMPLETED LINE ITEM, never an uploaded photo. Kevin merges
 * several photos of one object into one line, so photos would bill for our
 * clustering rather than for what the client receives.
 */

/** Covers onboarding, the review pass and delivery, at any size. There is no
 *  minimum line count and none should be added: the fee is the floor. */
export const DFY_SETUP_FEE = 199

/** `upTo: null` is the open-ended band, which is quoted by hand. */
export type DfyBand = { upTo: number | null; rate: number | null; label: string }

export const DFY_BANDS: DfyBand[] = [
  { upTo: 100, rate: 5.0, label: 'First 100 lines' },
  { upTo: 250, rate: 4.5, label: 'Lines 101–250' },
  { upTo: 500, rate: 4.0, label: 'Lines 251–500' },
  { upTo: 1000, rate: 3.5, label: 'Lines 501–1,000' },
  { upTo: null, rate: null, label: '1,001 and up' },
]

/** The largest line count this table prices without a conversation. */
export const DFY_AUTO_MAX = 1000

export type QuoteLine = { label: string; count: number; rate: number; amount: number }

export type DfyQuote = {
  lines: number
  setup: number
  /** Every band that contributed, in order, for a worked breakdown. */
  breakdown: QuoteLine[]
  lineTotal: number
  total: number
  /** Setup included — what the client actually pays per line. */
  perLine: number
}

/**
 * ⛔ THE ARITHMETIC RUNS IN INTEGER CENTS, and only the edges convert.
 *
 * $1,974 over 400 lines is exactly 4.935, and `Math.round(4.935 * 100)` gives
 * 493, not 494, because 4.935 is stored a hair under. Nudging by EPSILON does
 * not help either: at that magnitude the nudge is smaller than the gap between
 * representable doubles, so it rounds straight back. A per-line figure a cent
 * below the honest one, printed on a price list, is the error nobody catches
 * and everybody half-trusts -- so money never becomes a float until it is
 * being shown.
 */
const cents = (dollars: number) => Math.round(dollars * 100)
const dollars = (c: number) => c / 100

/** The marginal sum, in cents, for a whole number of lines. */
function lineCents(lines: number): number {
  let remaining = lines
  let floor = 0
  let total = 0
  for (const band of DFY_BANDS) {
    if (band.upTo === null || band.rate === null) break
    const inBand = Math.min(remaining, band.upTo - floor)
    if (inBand > 0) {
      total += inBand * cents(band.rate)
      remaining -= inBand
    }
    floor = band.upTo
    if (remaining <= 0) break
  }
  return total
}

/**
 * The per-line charge, marginal across the bands.
 *
 * Returns null above `DFY_AUTO_MAX`, where the answer is "talk to us" rather
 * than a number — a 5,000-line total loss is a different conversation about
 * timeline and staffing, not a bigger version of the same job.
 */
export function totalForLines(lines: number): number | null {
  if (!Number.isFinite(lines) || lines < 1) return null
  if (lines > DFY_AUTO_MAX) return null
  return dollars(lineCents(Math.floor(lines)))
}

/**
 * The whole quote, as a client reads it: setup, the bands that applied, and
 * what it comes to per line once the setup is spread across them.
 */
export function quoteFor(lines: number): DfyQuote | null {
  const lineTotal = totalForLines(lines)
  if (lineTotal === null) return null

  const n = Math.floor(lines)
  const breakdown: QuoteLine[] = []
  let remaining = n
  let floor = 0
  for (const band of DFY_BANDS) {
    if (band.upTo === null || band.rate === null) break
    const inBand = Math.min(remaining, band.upTo - floor)
    if (inBand > 0) {
      // The label narrows to what was actually used: a 400-line job's third
      // band is "Lines 251-400", not "Lines 251-500".
      const from = floor + 1
      const to = floor + inBand
      breakdown.push({
        label: from === 1 ? `First ${to} lines` : `Lines ${from}–${to}`,
        count: inBand,
        rate: band.rate,
        amount: dollars(inBand * cents(band.rate)),
      })
      remaining -= inBand
    }
    floor = band.upTo
    if (remaining <= 0) break
  }

  const totalCents = lineCents(n) + cents(DFY_SETUP_FEE)
  return {
    lines: n,
    setup: DFY_SETUP_FEE,
    breakdown,
    lineTotal,
    total: dollars(totalCents),
    // Half-up on an integer, so 493.5 cents is 494 rather than whatever the
    // double happened to store.
    perLine: dollars(Math.round(totalCents / n)),
  }
}

/**
 * What the client is told before any work runs.
 *
 * The CEILING, not an estimate: photos cluster into sets before anything is
 * priced, and a set becomes at most one line (a context or duplicate set
 * becomes none), so the finished count can only come in under this. Quoting
 * from the set count is what makes a per-line price acceptable to somebody who
 * cannot count the lines themselves.
 */
export function ceilingQuote(photoSets: number): DfyQuote | null {
  return quoteFor(photoSets)
}
