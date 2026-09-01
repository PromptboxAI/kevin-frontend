/**
 * The claim's photos and its overview rollups.
 *
 * Two screens' worth of derivation, kept away from React so it can be tested.
 * Everything here is a JOIN or a COUNT over payloads the API already returned --
 * no valuation math, no flag invention (rule 20). Where the payload carries no
 * answer, these functions return null and the UI says so, rather than deriving
 * something plausible from `category`.
 */

/** `GET /v1/claims/{id}/photos`. There is no image_url, filename, or EXIF here. */
export type ClaimPhoto = {
  photo_id: number
  /** Set iff the photo backs a line item. */
  item_id: number | null
  session_id: number | null
  /** Derived server-side so the null combinations never have to be reasoned about. */
  state: 'attached' | 'staged' | 'unattached'
  note: string | null
  room: string | null
  status: string | null
}

/**
 * What the photo is actually doing, which `state` alone does not say.
 *
 * `state: 'staged'` covers two different situations, and the difference matters
 * to whoever is looking at it:
 *
 *   status 'clustered' -- never processed. Genuinely waiting in a session.
 *   status 'promoted'  -- its session ran. It backed a line and was unlinked,
 *                         or its set promoted to nothing.
 *
 * Detaching a photo from a row puts it in the SECOND case, not into
 * `unattached` as the contract's note implies -- verified live: unlinking
 * photo 3909 from item 5556 returned `state: 'staged', status: 'promoted'`,
 * and `?state=unattached` still answered 0. Telling that adjuster their photo
 * is "waiting to be processed" would send them to a session that already ran.
 */
export type PhotoBucket = 'attached' | 'pending' | 'idle'

export function bucketOf(photo: ClaimPhoto): PhotoBucket {
  if (photo.state === 'attached') return 'attached'
  if (photo.state === 'staged' && photo.status === 'clustered') return 'pending'
  return 'idle'
}

export type PhotoStateFacet = {
  key: PhotoBucket
  label: string
  /** Why a photo is in this bucket, in the adjuster's terms. */
  blurb: string
  n: number
}

/**
 * The facets, built from what a photo is doing rather than what column it is in.
 *
 * The design's facets were matched / unmatched / low confidence / scene /
 * duplicate. Not one is a field on this payload: `unmatched` and `duplicate`
 * are staging-time outcomes that never reach a promoted claim, and confidence
 * lives on the ITEM. Facets that read a count and filter to something else are
 * worse than no facets, so these are the three real ones.
 */
export function stateFacets(photos: ClaimPhoto[]): PhotoStateFacet[] {
  const n = (bucket: PhotoBucket) => photos.filter((p) => bucketOf(p) === bucket).length
  const facets: PhotoStateFacet[] = [
    {
      key: 'attached',
      label: 'Backs a line item',
      blurb: 'Priced on the worksheet.',
      n: n('attached'),
    },
    {
      key: 'pending',
      label: 'Waiting in staging',
      blurb: 'Uploaded, never processed — no line item exists yet.',
      n: n('pending'),
    },
    {
      key: 'idle',
      label: 'Backing nothing',
      blurb: 'On the claim, attached to no line. Re-usable.',
      n: n('idle'),
    },
  ]
  return facets.filter((f) => f.n > 0)
}

/**
 * Room buckets, or null when the claim has no rooms at all.
 *
 * Null is the COMMON case today: nothing sends the per-batch `room` at upload,
 * so every photo on a real claim comes back `room: null`. A sidebar of one
 * bucket called "—" is furniture pretending to be a filter; the caller renders
 * an explanation instead.
 */
export function roomBuckets(photos: ClaimPhoto[]): { name: string; n: number }[] | null {
  const counts = new Map<string, number>()
  for (const p of photos) {
    const room = (p.room ?? '').trim()
    if (room) counts.set(room, (counts.get(room) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }))
}

/**
 * Which line item a photo backs.
 *
 * A photo backs AT MOST ONE item (rule 1) -- that direction is the product's
 * hard constraint. The reverse is not symmetric: one item can be backed by
 * several frames (a wide shot plus its model plate), which is why this maps
 * photo -> item and never the other way.
 */
export function itemForPhoto<T extends { id: number }>(
  photo: ClaimPhoto,
  itemsById: Map<number, T>,
): T | null {
  return photo.item_id == null ? null : (itemsById.get(photo.item_id) ?? null)
}

export function indexItems<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((i) => [i.id, i]))
}

/**
 * How many photos back each item, for the "2 of 3 frames" line in the detail.
 *
 * Counted over the photo payload rather than the item's own `photos` array, so
 * the gallery never has to fetch 52 item details to caption one frame.
 */
export function framesPerItem(photos: ClaimPhoto[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const p of photos) {
    if (p.item_id == null) continue
    counts.set(p.item_id, (counts.get(p.item_id) ?? 0) + 1)
  }
  return counts
}

export function frameIndex(photos: ClaimPhoto[], photo: ClaimPhoto): number {
  if (photo.item_id == null) return 1
  const siblings = photos.filter((p) => p.item_id === photo.item_id)
  return siblings.findIndex((p) => p.photo_id === photo.photo_id) + 1
}

// --------------------------------------------------------------------------
// Overview rollups
// --------------------------------------------------------------------------

export type RollupItem = {
  id: number
  category: string | null
  description: string | null
  make_mfr: string | null
  quantity: number
  status: string
  /** Tax-inclusive line total, SERVER-owned. Summed, never recomputed. */
  rcv_total_incl: number | null
}

export type ClassSlice = {
  cls: string
  n: number
  rcv: number
  /** Lines the backend would not price (rule 12). Counted, contributing $0. */
  unpriced: number
}

/**
 * Items by content class, biggest spend first.
 *
 * `needs_manual` rows are UNPRICED, not broken: they count toward `n` and
 * contribute 0 to `rcv`, exactly as the totals bar does. A class that is
 * entirely unpriced therefore shows its count with $0 rather than vanishing.
 */
export function classBreakdown(items: RollupItem[]): ClassSlice[] {
  const by = new Map<string, ClassSlice>()
  for (const it of items) {
    const cls = it.category?.trim() || 'No content class'
    const slice = by.get(cls) ?? { cls, n: 0, rcv: 0, unpriced: 0 }
    slice.n += 1
    if (it.status === 'needs_manual' || it.rcv_total_incl == null) slice.unpriced += 1
    else slice.rcv += it.rcv_total_incl
    by.set(cls, slice)
  }
  return [...by.values()].sort((a, b) => b.rcv - a.rcv || b.n - a.n)
}

/**
 * Collapse the tail so the legend stays readable.
 *
 * The remainder keeps its own count and sum, so the list still foots to the
 * claim total -- a "+ 4 more" row that drops its money makes the card lie.
 */
export function withTail(slices: ClassSlice[], keep: number): ClassSlice[] {
  if (slices.length <= keep) return slices
  const head = slices.slice(0, keep)
  const tail = slices.slice(keep)
  head.push({
    cls: `+ ${tail.length} more class${tail.length > 1 ? 'es' : ''}`,
    n: tail.reduce((a, s) => a + s.n, 0),
    rcv: tail.reduce((a, s) => a + s.rcv, 0),
    unpriced: tail.reduce((a, s) => a + s.unpriced, 0),
  })
  return head
}

/** Legend colours, cool slate → navy, matching the design's ramp. */
export const CLASS_COLORS = [
  'oklch(0.55 0.10 252)',
  'oklch(0.45 0.07 240)',
  'oklch(0.50 0.09 230)',
  'oklch(0.55 0.10 220)',
  'oklch(0.60 0.08 210)',
  'oklch(0.62 0.07 200)',
  'oklch(0.65 0.06 195)',
  'oklch(0.68 0.05 190)',
  'oklch(0.70 0.05 185)',
]

/**
 * The biggest lines on the claim.
 *
 * Unpriced rows are excluded -- not as a judgement, but because "highest value"
 * cannot rank a line with no value. They are already surfaced by the attention
 * strip, which is where an adjuster acts on them.
 */
export function highestValue(items: RollupItem[], take: number): RollupItem[] {
  return items
    .filter((i) => i.rcv_total_incl != null && i.status !== 'needs_manual')
    .sort((a, b) => (b.rcv_total_incl ?? 0) - (a.rcv_total_incl ?? 0))
    .slice(0, take)
}

export type Attention = {
  /** Lines the backend would not price. The ONLY thing waiting on a human. */
  unpriced: number
  /** Coverage, not a demand -- see below. */
  noModel: number
  total: number
}

/**
 * What the attention strip counts: unpriced lines, and nothing else.
 *
 * The prototype also counted lines with no model number, and on seed data that
 * read fine. On the first real claim it said "51 items need your attention" out
 * of 52 -- because 50 of those lines are belts, sandals and handbags, and a
 * wicker clutch has no model number to be missing. A banner that flags a
 * finished claim as broken trains the adjuster to ignore the banner.
 *
 * So `total` is `unpriced`: the one state rule 12 defines as waiting on a
 * person. Model-number coverage is still returned, and still worth showing --
 * it is an export column and it is what makes a line defensible -- but as a
 * neutral count, not an alarm. Which classes ought to carry a model number is
 * not the frontend's call to make (rule 20).
 */
export function attention(
  items: { status: string; rcv_total_incl: number | null; model_number: string | null }[],
): Attention {
  const unpriced = items.filter(
    (i) => i.status === 'needs_manual' || i.rcv_total_incl == null,
  ).length
  const noModel = items.filter((i) => !(i.model_number ?? '').trim()).length
  return { unpriced, noModel, total: unpriced }
}

/**
 * Photos that have produced nothing yet.
 *
 * Rule 22(e): staged photos have produced no line items, so they must never be
 * folded into the claim's item count. Surfacing them separately is the honest
 * alternative to hiding them -- the adjuster dropped them and is entitled to
 * know they are still sitting there.
 */
export function pendingPhotos(photos: ClaimPhoto[]): number {
  return photos.filter((p) => bucketOf(p) === 'pending').length
}
