import type { ClaimItem } from './types'

/** A worksheet row that already knows its line number. */
export type NumberedItem = ClaimItem & { lineNo: number }

/**
 * Assign each row its permanent line number, ONCE, at data level.
 *
 * The line number is the row's identity on a document a carrier has been sent
 * (rule 22b), so it can never be a function of viewport state. Numbering here
 * — before any filtering, grouping or windowing — means every downstream view
 * slices rows that already know their number, and the renderer never computes
 * one.
 *
 * Order is by `id` ascending because GET /v1/claim_items is newest-first: a
 * row added today must APPEND, not land at the top and renumber everything
 * beneath it.
 */
export function numberRows(items: ClaimItem[]): NumberedItem[] {
  return [...items]
    .sort((a, b) => a.id - b.id)
    .map((item, index) => ({ ...item, lineNo: index + 1 }))
}
