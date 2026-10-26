/**
 * The "before you send it" checks, in ONE place.
 *
 * The export page counts rows that need a look — unpriced, no model number, no
 * content class — and its Review buttons send the adjuster to the worksheet to
 * fix them. They used to land on line 1 of the whole claim, which on a 263-row
 * inventory means "2 lines need a class" followed by hunting for two rows
 * among two hundred and sixty-three.
 *
 * So the predicates live here and both screens read them. The export page
 * counts with them and links with the name; the worksheet filters with the
 * same function. A count that disagreed with the rows it filtered to would be
 * worse than the dead end it replaced — someone would stop trusting the panel.
 *
 * Import-free so it compiles and runs standalone under node for its tests.
 */

export type ReviewFilter = '' | 'unpriced' | 'no_model' | 'no_class' | 'no_desc'

export const REVIEW_FILTERS: Exclude<ReviewFilter, ''>[] = [
  'unpriced',
  'no_model',
  'no_class',
  'no_desc',
]

/** What the worksheet's chip says it is showing. */
export const REVIEW_LABEL: Record<Exclude<ReviewFilter, ''>, string> = {
  unpriced: 'Unpriced',
  no_model: 'No model number',
  no_class: 'No content class',
  no_desc: 'Needs a description',
}

type ReviewableItem = {
  rcv?: number | null
  status?: string | null
  model_number?: string | null
  category?: string | null
  description?: string | null
}

export function isReviewFilter(value: string | null | undefined): value is Exclude<
  ReviewFilter,
  ''
> {
  return !!value && (REVIEW_FILTERS as string[]).includes(value)
}

/**
 * Does this line need the look that `filter` names?
 *
 * `unpriced` deliberately tests BOTH a null price and `needs_manual`, matching
 * the export panel exactly: a line the adjuster already hand-priced is not
 * unpriced, and a `needs_manual` line that somehow carries a price is not
 * either. An empty filter matches everything, so callers can pass state
 * straight through.
 */
export function matchesReview(item: ReviewableItem, filter: ReviewFilter): boolean {
  switch (filter) {
    case 'unpriced':
      return item.rcv == null && item.status === 'needs_manual'
    case 'no_model':
      return !item.model_number?.trim()
    case 'no_class':
      return !item.category
    case 'no_desc':
      return !(item.description ?? '').trim()
    default:
      return true
  }
}

/** The worksheet route with a review filter applied, for the export's links. */
export function reviewHref(claimId: string, filter: Exclude<ReviewFilter, ''>): string {
  return `/claims/${encodeURIComponent(claimId)}?review=${filter}`
}
