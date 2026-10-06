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
 * THE NUMBER IS PERSISTED NOW, and this paragraph used to say the opposite.
 * It described the world before migration 0062: both sides derived the number
 * from POSITION, so deleting a row shifted every row beneath it and a schedule
 * already sent to a carrier started citing different items. That was ask 29,
 * the backend shipped it, and `claims.next_line_no` plus an insert trigger now
 * assign a number at creation that is never reused or renumbered.
 *
 * The export reads the same column (`it.get("line_no") or n` in
 * services/export.py), so the two surfaces agree. Left here corrected rather
 * than deleted because the stale version sent someone back to re-raise an ask
 * that had already been built -- if this ever reads as out of date again,
 * check the schema before writing a prompt.
 *
 * Order is by `id` ascending because GET /v1/claim_items is newest-first: a
 * row added today must APPEND, not land at the top and renumber everything
 * beneath it.
 */
export function numberRows(items: ClaimItem[]): NumberedItem[] {
  const sorted = [...items].sort((a, b) => a.id - b.id)
  /*
   * PREFER THE SERVER'S NUMBER when it sends one. `line_no` is assigned at
   * creation and never reused, so a delete leaves a gap rather than shifting
   * every row beneath it -- which is what rule 22(b) has always required and
   * what position-numbering cannot give (BACKEND-PROMPTS 10).
   *
   * ALL OR NOTHING, deliberately. A mixed set -- some rows backfilled, some
   * not -- would mingle two numbering schemes and could repeat a number, which
   * is worse on an exported schedule than being uniformly wrong. So the
   * fallback only lifts when EVERY row carries one.
   *
   * NOTE this is a different shape from the export, which falls back PER ROW.
   * On a claim holding both numbered and null rows the two would disagree. The
   * 0062 backfill numbered every row with a `created_by`, and ownerless rows
   * are whole legacy claims rather than stragglers inside a live one, so such
   * a claim should not exist -- but if one turns up, this is the line to
   * change (BACKEND-ASKS 29).
   */
  const numbered = sorted.every(
    (item) => typeof item.line_no === 'number' && Number.isFinite(item.line_no),
  )
  return sorted.map((item, index) => ({
    ...item,
    lineNo: numbered ? (item.line_no as number) : index + 1,
  }))
}

/**
 * The worksheet's counting invariant.
 *
 * ⚠️ A GAP IN THE NUMBERS IS NOT A FAULT. This used to require
 * `maxLineNo === items.length` and a strict 1..N run, which was right while
 * the number was the row's POSITION. It stopped being right the moment the
 * server started sending `line_no`: that number is assigned at creation and
 * never reused, so deleting a row leaves a hole by design -- see numberRows
 * above, and rule 22(b), which exists precisely so an export already sent to a
 * carrier keeps citing the same items.
 *
 * The result was a red "count mismatch" in the footer of every claim anyone
 * had ever deleted anything from, reporting 160 of 160 rows as a mismatch
 * because the highest line was 161. A warning that fires on correct data
 * teaches people to ignore warnings.
 *
 * What is still worth asserting, because each one would really be a bug:
 *
 * - the grid renders as many rows as the API counted;
 * - no line number appears twice (a duplicate on an exported schedule points
 *   two carriers at different items with the same number);
 * - the numbers ascend with the rows, so the grid is in line order.
 *
 * Contiguity is still checked under the INDEX fallback, where numbers are 1..N
 * by construction and a break would mean numberRows itself had gone wrong.
 */
export function rowInvariant(items: NumberedItem[], apiCount: number) {
  const maxLineNo = items.reduce((max, r) => Math.max(max, r.lineNo), 0)
  const lineNos = items.map((r) => r.lineNo)
  const duplicates = lineNos.length !== new Set(lineNos).size
  const ascending = lineNos.every((n, i) => i === 0 || n > lineNos[i - 1])

  /** Server numbering is in use when every row carries its own `line_no`. */
  const serverNumbered =
    items.length > 0 &&
    items.every((item) => typeof item.line_no === 'number' && Number.isFinite(item.line_no))

  // Only meaningful under the fallback; gaps are expected and correct otherwise.
  const contiguous = serverNumbered || lineNos.every((n, i) => n === i + 1)

  return {
    ok: items.length === apiCount && !duplicates && ascending && contiguous,
    rendered: items.length,
    apiCount,
    maxLineNo,
    duplicates,
    ascending,
    contiguous,
    serverNumbered,
    /** True when numbers skip -- normal after a delete, and NOT a fault. */
    hasGaps: serverNumbered && maxLineNo > items.length,
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
