/**
 * The claim-wide audit trail, arranged for reading. No React, no fetch.
 *
 * The events themselves are the same shape as an item's history
 * (`lib/item-events`), which is deliberate: one describer, one vocabulary, so
 * the sentence an adjuster reads in the item drawer is the sentence they read
 * on the claim's timeline. What changes here is only the arrangement — by day,
 * newest first, with the line each event belongs to.
 *
 * A claim-level event (created, processed, exported) carries no
 * `claim_item_id`. It is not an error and it is not an orphan: it belongs to
 * the claim itself, and it is what makes the timeline the whole story rather
 * than a list of row edits.
 */

/** Only what the arrangement needs; the full shape is `ItemEvent`. */
export type DatedEvent = {
  id: string
  claim_item_id: number | null
  created_at: string | null
}

export type EventDay<T> = { label: string; key: string; events: T[] }


const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Local calendar day, as `2026-09-28` — never UTC: an edit made at 8pm on the
 *  28th is on the 28th to the person who made it, wherever the server is. */
export function localDay(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * "Today" and "Yesterday" for the two days somebody actually remembers, a
 * dated heading for everything older. The year is included only when it is not
 * the current one — "Sep 12" reads better than "Sep 12, 2026" all the way down
 * a page, but a 2025 event must never look like this year's.
 */
export function dayLabel(key: string, now: Date = new Date()): string {
  const today = localDay(now.toISOString())
  if (key === today) return 'Today'
  const y = new Date(now)
  y.setDate(y.getDate() - 1)
  if (key === localDay(y.toISOString())) return 'Yesterday'
  const [year, month, day] = key.split('-').map(Number)
  const head = `${MONTHS[(month ?? 1) - 1]} ${day}`
  return year === now.getFullYear() ? head : `${head}, ${year}`
}

/**
 * Newest first, grouped by day, and STABLE: events that arrive with no
 * timestamp keep the order the server sent rather than being dropped. A
 * missing date is a gap in the record, and a record that hides its gaps is
 * not an audit trail.
 */
export function groupByDay<T extends DatedEvent>(events: T[], now: Date = new Date()): EventDay<T>[] {
  const days = new Map<string, T[]>()
  for (const event of events) {
    const key = localDay(event.created_at) ?? 'undated'
    const bucket = days.get(key)
    if (bucket) bucket.push(event)
    else days.set(key, [event])
  }
  const keys = [...days.keys()].sort((a, b) => {
    if (a === 'undated') return 1
    if (b === 'undated') return -1
    return b.localeCompare(a)
  })
  return keys.map((key) => ({
    key,
    label: key === 'undated' ? 'No date recorded' : dayLabel(key, now),
    events: days.get(key) ?? [],
  }))
}

/**
 * How a line is named on the timeline.
 *
 * The description RIDES ON THE EVENT (`claim_item_description`): the join that
 * scopes the query is already reading the row, so the tab does not hold the
 * whole item list just to print a name -- 507 rows fetched to label a page of
 * 50. A row deleted since keeps whatever name the event recorded, and falls
 * back to its id rather than vanishing: the change still happened.
 */
export function lineLabel(event: {
  claim_item_id: number
  claim_item_description?: string | null
}): string {
  const desc = event.claim_item_description?.trim()
  return desc || `Line ${event.claim_item_id}`
}

/**
 * Whether there is another page, from the SERVER's two counts.
 *
 * `count` is this page and `total` is the claim's lifetime count; paging on
 * `count` stops at the first short page. `total` is null when the count query
 * failed, and then the only honest signal left is whether this page came back
 * full -- a short page means the end, a full one means try again.
 */
export function nextOffset(
  seen: number,
  page: { count: number; total: number | null; limit: number },
): number | undefined {
  if (page.total != null) return seen < page.total ? seen : undefined
  return page.count >= page.limit ? seen : undefined
}
