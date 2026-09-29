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
