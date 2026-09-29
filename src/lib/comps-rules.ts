/**
 * Which comp the price came from.
 *
 * Since 2026-09-29 the engine prices a line at an ACTUAL LISTING -- the middle
 * one by price among the comps it found -- and the Source Link points at that
 * exact listing. Before that it was the median of the set, a number that
 * frequently matched no individual comp.
 *
 * ⛔ SO THE RULE CANNOT BE ASSERTED FROM THE OUTSIDE. Lines priced before that
 * deploy keep the price they were given, and nothing in the payload says which
 * rule produced it. A blanket "the unit cost is one of these" would be false on
 * every historical line, on the one screen whose job is to justify a number to
 * a carrier.
 *
 * What IS checkable is the arithmetic: if a comp's price equals the unit cost,
 * that comp is the one cited, and saying so is a fact about this line rather
 * than a claim about the engine. Historical lines simply match nothing and get
 * no claim at all.
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
