/**
 * Done-for-you pricing. One implementation, no React, no fetch.
 *
 * This exists so the published table, the quote a client is shown, and the
 * invoice that follows can never disagree. The rates were a hand-written array
 * beside hand-written worked examples, which is how the previous scheme ended
 * up with a table whose own example contradicted it.
 *
 * ⛔ THIS IS A DISPLAY MIRROR, NOT THE AUTHORITY. The quote a client accepts is
 * the server's quote record (BACKEND-PROMPTS 12); the page renders the
 * published examples from here so they cannot drift from the rate card. When
 * the backend ships its pricing config, the page should read the bands from it
 * and this file shrinks to formatting.
 *
 * ⛔ MARGINAL, NOT FLAT PER TIER (owner, 2026-10-02). Each band prices only the
 * lines inside it. The scheme it replaced picked ONE rate by line count and
 * applied it to every line, which made the invoice fall at every boundary: 800
 * lines billed $2,800 and 801 billed $2,002.50. `totalForLines` is monotonic by
 * construction and `scripts/test-dfy-pricing.mjs` asserts it at every count.
 *
 * ⛔ $750 MINIMUM PROJECT FEE, NO SETUP FEE (owner, 2026-10-22). The price is
 * `max(750, marginal total)`. It replaced a $199 setup fee added on top: the
 * NY market benchmark starts at $750 for a small loss, and Kevin does not
 * compete by underpricing it. Still no minimum LINE COUNT — the fee is the
 * floor, and an eight-line jewelry schedule is a $750 job, not a refusal.
 *
 * ⛔ THE UNIT IS A COMPLETED (PROMOTED) LINE ITEM, never an uploaded photo,
 * staging photo or candidate set. Kevin merges several photos of one object
 * into one line, and a context or duplicate set promotes to none.
 */

/** The least any engagement costs. Applied by max(), never added. */
export const DFY_MINIMUM_FEE = 750

/** `upTo: null` is the open-ended band. */
export type DfyBand = { upTo: number | null; rate: number; label: string }

export const DFY_BANDS: DfyBand[] = [
  { upTo: 100, rate: 5.0, label: 'First 100 lines' },
  { upTo: 250, rate: 4.5, label: 'Lines 101–250' },
  { upTo: 500, rate: 4.0, label: 'Lines 251–500' },
  { upTo: 1000, rate: 3.5, label: 'Lines 501–1,000' },
  { upTo: null, rate: 3.0, label: '1,001 and up' },
]

/** From here the $3.00 band still prices the job, but a custom volume rate is
 *  on the table — a 5,000-line total loss is a conversation about timeline
 *  and staffing as much as price. */
export const DFY_CUSTOM_FROM = 1001

/**
 * The public "typical examples". Dollar ranges, not line counts, because a
 * homeowner cannot count lines — `linesWithin` translates each into the line
 * count it buys, so the ranges can never claim a size the bands do not price.
 * `to: null` is open-ended; `from: null` is quoted by hand.
 */
export type DfyTypical = { label: string; from: number | null; to: number | null }

export const DFY_TYPICAL: DfyTypical[] = [
  { label: 'Small contents loss', from: 750, to: 1000 },
  { label: 'Medium inventory', from: 1000, to: 1750 },
  { label: 'Large residential inventory', from: 1750, to: 3000 },
  { label: 'Major or total-loss inventory', from: 3000, to: null },
  { label: 'Commercial', from: null, to: null },
]

export type QuoteLine = { label: string; count: number; rate: number; amount: number }

export type DfyQuote = {
  lines: number
  /** Every band that contributed, in order, for a worked breakdown. */
  breakdown: QuoteLine[]
  /** The marginal sum before the minimum. */
  lineTotal: number
  minimum: number
  /** True when the minimum, not the lines, set the price. */
  minimumApplied: boolean
  total: number
  /** What the client actually pays per line, minimum included. */
  perLine: number
  /** Large enough that a custom volume rate may apply instead. */
  customEligible: boolean
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

type BandUse = { from: number; to: number; rate: number; cents: number }

/** The bands a whole number of lines falls across, in cents. */
function bandsFor(lines: number): BandUse[] {
  const out: BandUse[] = []
  let remaining = lines
  let floor = 0
  for (const band of DFY_BANDS) {
    if (remaining <= 0) break
    const inBand = band.upTo === null ? remaining : Math.min(remaining, band.upTo - floor)
    if (inBand > 0) {
      out.push({ from: floor + 1, to: floor + inBand, rate: band.rate, cents: inBand * cents(band.rate) })
      remaining -= inBand
    }
    if (band.upTo !== null) floor = band.upTo
  }
  return out
}

const lineCents = (lines: number) => bandsFor(lines).reduce((s, b) => s + b.cents, 0)

/** The marginal line charge for a whole number of lines, minimum NOT applied.
 *  Null for anything that is not a positive count. */
export function totalForLines(lines: number): number | null {
  if (!Number.isFinite(lines) || lines < 1) return null
  return dollars(lineCents(Math.floor(lines)))
}

/** What the client pays for `lines`: `max(minimum, marginal total)`. */
export function priceForLines(lines: number): number | null {
  const lineTotal = totalForLines(lines)
  if (lineTotal === null) return null
  return Math.max(DFY_MINIMUM_FEE, lineTotal)
}

const count = (n: number) => n.toLocaleString('en-US')

/**
 * The whole quote, as a client reads it: the bands that applied, whether the
 * minimum set the price, and what it comes to per line.
 */
export function quoteFor(lines: number): DfyQuote | null {
  const lineTotal = totalForLines(lines)
  if (lineTotal === null) return null

  const n = Math.floor(lines)
  // The label narrows to what was actually used: a 400-line job's third band
  // is "Lines 251-400", not "Lines 251-500".
  const breakdown: QuoteLine[] = bandsFor(n).map((b) => ({
    label: b.from === 1 ? `First ${count(b.to)} lines` : `Lines ${count(b.from)}–${count(b.to)}`,
    count: b.to - b.from + 1,
    rate: b.rate,
    amount: dollars(b.cents),
  }))

  const totalCents = Math.max(lineCents(n), cents(DFY_MINIMUM_FEE))
  return {
    lines: n,
    breakdown,
    lineTotal,
    minimum: DFY_MINIMUM_FEE,
    minimumApplied: lineCents(n) < cents(DFY_MINIMUM_FEE),
    total: dollars(totalCents),
    // Half-up on an integer, so 493.5 cents is 494 rather than whatever the
    // double happened to store.
    perLine: dollars(Math.round(totalCents / n)),
    customEligible: n >= DFY_CUSTOM_FROM,
  }
}

/**
 * The most lines a budget buys at the marginal rates — how the public dollar
 * ranges are translated into a size. Monotonic, so a walk is exact.
 */
export function linesWithin(budget: number): number {
  const cap = cents(budget)
  let n = 0
  while (lineCents(n + 1) <= cap) n++
  return n
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
