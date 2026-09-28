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

/** A row the timeline can point at, from the claim's own item list. */
export type ItemRef = { lineNo: number; description: string | null }

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
 * How a row is named on the timeline. `#0042 · Brown Leather Belt` when the
 * claim's items are loaded; the bare number when they are not, because an
 * event about a row deleted since still happened and must still be listed.
 */
export function itemLabel(
  claimItemId: number | null,
  items: Map<number, ItemRef>,
): string | null {
  if (claimItemId == null) return null
  const item = items.get(claimItemId)
  if (!item) return 'Deleted line'
  const number = `#${String(item.lineNo).padStart(4, '0')}`
  return item.description ? `${number} · ${item.description}` : number
}

/** How many of these are the claim's own, not a line's. */
export function claimLevelCount(events: DatedEvent[]): number {
  return events.filter((e) => e.claim_item_id == null).length
}
