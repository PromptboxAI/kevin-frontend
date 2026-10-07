/**
 * Which comp the price came from.
 *
 * Since 2026-09-29 the engine prices a line at an ACTUAL LISTING -- the middle
 * one by price among the comps it found -- and the Source Link points at that
 * exact listing. Before that it was the median of the set.
 *
 * ⛔ THE RULE CANNOT BE ASSERTED FROM THE OUTSIDE, in either direction. A line
 * priced before that deploy keeps the price it was given and nothing in the
 * payload says which rule produced it -- but "historical lines match no comp"
 * is equally wrong: measured by the backend, 43.2% of them DO match exactly,
 * because an odd comp count always put the median on a real listing. So a
 * badged old row is not a bug to chase; on that row the price genuinely is
 * that listing's price.
 *
 * What IS checkable is the arithmetic: if a comp's price equals the unit cost,
 * that comp is the one cited, and saying so is a fact about THIS line rather
 * than a claim about the engine.
 *
 * ⛔ AND THE PANEL IS USUALLY A SAMPLE, not the bucket. Over 755 real buckets:
 * 87.4% hold more than the three surfaced, 12.6% hold three or fewer (where
 * the panel IS the whole set), and 3.2% hold exactly two (where the "middle"
 * is visibly just the dearer of the pair). No wording that describes the
 * METHOD is true in all three cases, which is why the drawer names the marked
 * listing instead -- and why `comp_sample_size` matters: it makes the claim
 * checkable rather than trusted.
 */
export type PricedComp = { price?: number | string | null }

const cents = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

/**
 * The index of the comp whose price IS the unit cost, or null when none is.
 *
 * Compared in whole cents, because 74.94 in the payload and 74.94 rebuilt from
 * a float are not always the same double, and a rounding artefact must not
 * decide whether we can name the source of a price.
 */
export function citedCompIndex(
  rcv: number | null | undefined,
  comps: readonly PricedComp[] | null | undefined,
): number | null {
  const target = cents(rcv)
  if (target === null || !comps?.length) return null
  for (let i = 0; i < comps.length; i += 1) {
    if (cents(comps[i]?.price) === target) return i
  }
  return null
}

/**
 * How large the bucket was, said only when the server recorded it.
 *
 * `comp_sample_size` counts the whole trimmed bucket the price was selected
 * from, which is usually larger than the handful of comps surfaced -- so a
 * client computing "the middle of N" from the visible rows would be wrong,
 * and this is the only honest source for N.
 *
 * NULL means "not recorded": every line priced before the field ships, and
 * every hand-entered price, which comes from no bucket at all. Zero is
 * treated the same way rather than printed, because "picked from 0 listings"
 * asserts something false about how the line was priced. Same rule as an
 * unmatched cited comp: when we do not know, we say nothing.
 */
export function sampleNote(
  sampleSize: number | null | undefined,
  shown: number,
): string | null {
  if (typeof sampleSize !== 'number' || !Number.isFinite(sampleSize) || sampleSize < 1) return null
  const listings = `${sampleSize} listing${sampleSize === 1 ? '' : 's'}`
  // Only worth saying when the panel is genuinely a sample of something larger.
  if (shown > 0 && sampleSize > shown) return `picked from ${listings}, ${shown} shown here`
  return `picked from ${listings}`
}

/**
 * Does the totals bar agree with the rows on screen?
 *
 * ⚠️ THIS NEVER PRODUCES A NUMBER FOR DISPLAY. The money chain is server-owned
 * and `computeACV()` was deleted precisely so the UI can never quietly
 * contradict the exported file. This sums the rows ONLY to answer a yes/no
 * question — "are these two views of the same claim out of step?" — and the
 * answer is a prompt to refresh, never a figure.
 *
 * It exists because the two come from different endpoints: rows from
 * /v1/claim_items, the totals from the claim's own server rollup. They drifted
 * for ten minutes with prices visible in the grid and a total that had not
 * moved, and nothing on the page could tell the adjuster which half to believe.
 */
export type TotalsCheck =
  | { state: 'ok' }
  /** Not every row is loaded, so a sum would be meaningless. */
  | { state: 'partial' }
  /** Still pricing — they are SUPPOSED to disagree while lines land. */
  | { state: 'moving' }
  | { state: 'stale' }

/**
 * Tolerance scales with row count, so the KNOWN per-line rounding drift never
 * raises this. Sales tax rounds per line and the rollup rounds once, which on
 * a 21-line claim already differs by 4 cents (BACKEND-PROMPTS 13). A cent a
 * line plus a nickel of slack keeps that quiet while a stale rollup -- which is
 * wrong by whole items, usually hundreds of dollars -- still trips it.
 */
export function totalsTolerance(rowCount: number): number {
  return 0.05 + rowCount * 0.01
}

export function checkTotals(input: {
  /** rcv_total_incl for every row the grid has loaded. */
  loadedRowTotals: number[]
  /** The server's rollup, as the totals bar prints it. */
  claimTotal: number | null | undefined
  /** True when the grid still has pages it has not fetched. */
  hasMore: boolean
  /** Lines the server says are still being priced. */
  processing: number
  /**
   * Both reads have finished. FALSE while either is in flight — including the
   * refetch-on-mount, which is where this got it wrong.
   *
   * The rows and the totals are separate cached queries. On load React Query
   * serves both from cache instantly, and if they were cached at different
   * moments the sums disagree for a few hundred milliseconds until the
   * refetches land. The alert fired, then vanished. An alert that cries wolf
   * on every page load is worth less than no alert, because the one time it
   * matters nobody will believe it.
   */
  settled: boolean
}): TotalsCheck {
  if (input.processing > 0) return { state: 'moving' }
  if (!input.settled) return { state: 'partial' }
  if (input.hasMore) return { state: 'partial' }
  if (input.claimTotal == null) return { state: 'partial' }
  const sum = input.loadedRowTotals.reduce((a, n) => a + (Number.isFinite(n) ? n : 0), 0)
  const drift = Math.abs(sum - input.claimTotal)
  return drift > totalsTolerance(input.loadedRowTotals.length) ? { state: 'stale' } : { state: 'ok' }
}

/**
 * Is this comp's link worth putting an `<a>` on?
 *
 * Only ONE comp per line gets its real merchant URL resolved -- the resolution
 * costs a search credit, so the backend spends it once. The rest keep Google's
 * redirect, which does not land on a listing and reads as sloppy
 * substantiation next to a price.
 *
 * ⛔ WHICH comp holds the real one has MOVED, so do not key off a position.
 * Until 2026-09-24 it was `alternative_sources[0]`, the preferred source for
 * the content class; since then it is the comp nearest the RCV. The drawer was
 * written against the old rule and spent a year putting the link on index 0.
 *
 * Nor is it safe to key off the cited comp. "Nearest the RCV" and "price EQUALS
 * the RCV" are different comps on a line priced before 2026-09-29, where the
 * RCV is a median that may match nothing -- `citedCompIndex` correctly says
 * nothing there, yet one of those comps does hold a real link.
 *
 * So TEST THE VALUE, which is true under every one of those rules and needs no
 * payload field: a link is substantiation when it points at a merchant rather
 * than back at Google. Same discipline as `citedCompIndex` -- nothing in the
 * payload says which rule ran, so read what is actually there.
 */
const GOOGLE_HOST = /(^|\.)(google\.[a-z]{2,}(\.[a-z]{2,})?|googleadservices\.com|googleusercontent\.com|gstatic\.com)$/i

export function isMerchantLink(url: string | null | undefined): boolean {
  if (!url) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  /* Comps come from a third party and land in an href, so anything that is not
     plain web navigation is refused rather than rendered. */
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
  return !GOOGLE_HOST.test(parsed.hostname)
}
