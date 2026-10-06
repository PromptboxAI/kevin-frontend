import { api } from './api'
import type { ClaimItemListResponse } from './types'

/**
 * Every line item on a claim, paged.
 *
 * ⚠️ `limit` IS CAPPED AT 100 BY THE SERVER. `CLAIM_LIST_MAX_LIMIT` in
 * main.py clamps it (`limit = max(1, min(limit, CLAIM_LIST_MAX_LIMIT))`), and
 * it does so SILENTLY — the response looks like a complete one, with a `count`
 * that tells the truth and an `items` array that does not.
 *
 * Three screens asked for `limit=500` and believed they had everything:
 *
 * - the Photos tab, whose line-number map is built only when every item is
 *   present, so on a 161-item claim it was empty — every tile fell back to
 *   "Photo 6237" and the grid could not be sorted into worksheet order;
 * - the claim Overview, whose rollups were computed over the first 100 rows;
 * - the Recovery screen, which filters priced lines for a holdback figure.
 *
 * The last one is the reason this is a shared helper rather than three fixes:
 * a money figure quietly computed over the first hundred of a hundred and
 * sixty-one lines is wrong in a way nobody would spot by looking at it.
 *
 * All three share the query key `['claim-items-flat', claimId]`, so they share
 * one cache entry and whichever mounted first decided what the others saw.
 * One fetcher means that no longer matters.
 */

/** The server's own cap. Asking for more is silently reduced to this. */
export const CLAIM_ITEMS_PAGE = 100

/**
 * Enough for an estate (rule 9 puts those in the hundreds to thousands) while
 * still bounded, so a claim that somehow reports a count it cannot serve
 * cannot spin forever.
 */
export const CLAIM_ITEMS_MAX_PAGES = 30

export async function fetchAllClaimItems(claimId: string): Promise<ClaimItemListResponse> {
  const url = (offset: number) =>
    `/v1/claim_items?claim_id=${encodeURIComponent(claimId)}&limit=${CLAIM_ITEMS_PAGE}` +
    (offset ? `&offset=${offset}` : '')

  const first = await api.get<ClaimItemListResponse>(url(0))
  const items = [...first.items]

  for (let page = 1; items.length < first.count && page < CLAIM_ITEMS_MAX_PAGES; page += 1) {
    const next = await api.get<ClaimItemListResponse>(url(page * CLAIM_ITEMS_PAGE))
    // A short or empty page means the server has no more to give, whatever
    // `count` claimed. Looping on a count that never arrives is worse than
    // returning what exists.
    if (next.items.length === 0) break
    items.push(...next.items)
  }

  return { ...first, items }
}
