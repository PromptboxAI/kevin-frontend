import type { ClaimItem } from './types'

/** A worksheet row that already knows its line number. */
export type NumberedItem = ClaimItem & { lineNo: number }

/**
 * Assign each row its line number, ONCE, at data level.
 *
 * The line number is the row's identity on a document a carrier has been sent
 * (rule 22b), so it can never be a function of viewport state. Numbering here
 * — before any filtering, grouping or windowing — means every downstream view
 * slices rows that already know their number, and the renderer never computes
 * one.
 *
 * It is NOT permanent, and cannot be from here: the number is this row's
 * POSITION, so deleting an earlier row shifts every row beneath it up by one.
 * The export does exactly the same thing (`enumerate(items, start=1)` in
 * services/export.py), and nothing persists a line number, so a schedule
 * already sent to a carrier can end up citing numbers that no longer point at
 * the same items. The delete confirmation says so on an exported claim; ask 29
 * is the durable fix.
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

/**
 * The worksheet's counting invariant: when nothing is filtered, the API's
 * `count`, the number of rows in the grid, and the highest line number must
 * all agree. A disagreement means rows are being counted that are not being
 * rendered as lines -- deleted rows still in the array, or an aborted create
 * that left a row behind -- and the footer would claim more lines than exist.
 */
export function rowInvariant(items: NumberedItem[], apiCount: number) {
  const maxLineNo = items.reduce((max, r) => Math.max(max, r.lineNo), 0)
  const lineNos = items.map((r) => r.lineNo)
  const duplicates = lineNos.length !== new Set(lineNos).size
  const contiguous = lineNos.every((n, i) => n === i + 1)
  return {
    ok: items.length === apiCount && maxLineNo === items.length && !duplicates && contiguous,
    rendered: items.length,
    apiCount,
    maxLineNo,
    duplicates,
    contiguous,
  }
}

/**
 * The virtual window, as a pure function so it can be stress-tested.
 *
 * Every input is clamped. A fast flick can hand us a scrollTop past the end of
 * the content (momentum, rubber-banding, a resize mid-scroll), and an
 * unclamped slice returns an EMPTY window -- which unmounts every row and
 * paints the page white. NaN can arrive the same way if a height is measured
 * before layout.
 *
 * `rowH` must equal the row's ACTUAL rendered height. If the two disagree the
 * spacers mis-size, scroll offset maps to the wrong index, and the number of
 * rows on screen drifts from the number in the array.
 */
export function windowRange(
  scrollTop: number,
  viewportH: number,
  rowH: number,
  count: number,
  overscan = 8,
) {
  const rows = Math.max(0, Math.floor(count) || 0)
  const height = Number.isFinite(rowH) && rowH > 0 ? rowH : 1
  const view = Number.isFinite(viewportH) && viewportH > 0 ? viewportH : 0
  const top = Number.isFinite(scrollTop) && scrollTop > 0 ? scrollTop : 0

  // Clamp the START to the last row, not to the count: clamping both to `rows`
  // makes slice(count, count) return NOTHING, which unmounts every row and
  // paints the page white. A non-empty list must always render at least one row.
  const first = rows === 0 ? 0 : Math.max(0, Math.min(rows - 1, Math.floor(top / height) - overscan))
  const last =
    rows === 0
      ? 0
      : Math.max(first + 1, Math.min(rows, Math.ceil((top + view) / height) + overscan))

  return {
    startIdx: first,
    endIdx: last,
    padTop: first * height,
    padBottom: Math.max(0, (rows - last) * height),
  }
}
