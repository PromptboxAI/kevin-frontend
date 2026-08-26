/**
 * Staging rules and types, deliberately free of any import.
 *
 * These encode when a grouping action is AVAILABLE. Every one of them exists to
 * stop the UI offering an action the contract guarantees will 409, so they are
 * kept pure and unit-tested rather than discovered at runtime.
 */
export type PhotoStatus = 'uploaded' | 'extracted' | 'clustered' | 'promoted'

export type StagingPhoto = {
  id: number
  note: string | null
  room: string | null
  status: PhotoStatus
  /**
   * OPTIONAL AND OFTEN NULL, permanently.
   *
   * `filename` was not captured on uploads before this week and cannot be
   * backfilled, so any older photo will carry null forever. Never render it
   * raw -- go through `photoLabel()`, which falls back rather than printing
   * "null" or collapsing the line.
   */
  filename?: string | null
  /** Capture time. Same rule: absent on older rows. */
  taken_at?: string | null
}

/**
 * What to call a photo on screen.
 *
 * A missing filename is normal history, not an error, so it reads as an
 * ordinary photo rather than announcing that data is absent.
 */
export function photoLabel(photo: Pick<StagingPhoto, 'id' | 'filename'>): string {
  const name = photo.filename?.trim()
  return name && name.length > 0 ? name : `Photo ${photo.id}`
}

/** Filenames for a set, skipping the ones that were never captured. */
export function photoFilenames(photos: Pick<StagingPhoto, 'filename'>[]): string[] {
  return photos.map((p) => p.filename?.trim()).filter((n): n is string => !!n && n.length > 0)
}

export type GroupKind = 'item' | 'context' | 'duplicate'

export type StagingGroup = {
  group_key: string
  kind: GroupKind
  /**
   * Clustering could not validate this stack.
   *
   * ACTIONABLE, and this is the last moment it can be. At promote the backend
   * calls build_stack_query with exact_identifier_only=True on these: only a
   * barcode or exact identifier may price them, and everything derived from
   * the photos is deliberately refused. Otherwise the line lands `needs_manual`
   * and has to be chased backwards from the worksheet.
   *
   * The one thing that rescues it lives on this screen: a set note a HUMAN
   * wrote becomes the search query. A machine-derived note never does. So the
   * cue exists to get the adjuster to write one, and it needs no item name to
   * do that.
   *
   * Read THIS, never a `reason` prefix -- the suffix changes freely.
   */
  vision_fallback?: boolean
  reason: string | null
  confidence: number | null
  /** Fused by the backend. NEVER re-concatenate client-side. */
  note: string | null
  /** Branch on THIS, never on the note text. */
  note_source: 'derived' | 'adjuster' | null
  room: string | null
  photos: StagingPhoto[]
  /**
   * Vision's guess at the item. NOT FOR THE STAGING CARD -- see rule 23: no
   * names, makes or models before the adjuster has reviewed the set, so a
   * machine's guess cannot anchor their read of it. These belong to the
   * worksheet and the item drawer, post-promote.
   */
  suggested_description?: string | null
  suggested_make?: string | null
  suggested_category?: string | null
}

export type StagingTally = {
  photos: number
  line_items: number
  grouped: number
  skipped: number
  duplicates: number
}

export type StagingSessionFull = {
  id: number
  claim_id: string
  status: 'uploading' | 'clustering' | 'review' | 'processed'
  photo_count: number
  groups: StagingGroup[] | null
  tally: StagingTally | null
  ungrouped_photos: StagingPhoto[]
}

export const NOTE_MAX = 300
export const THUMB_BATCH = 100

/**
 * Does this set carry a note that will actually price it?
 *
 * Mirrors the server's rule exactly, and both halves matter:
 *
 *   if not query and g.get("note_source") == NOTE_SOURCE_ADJUSTER:
 *       query = (g.get("note") or "").strip() or None
 *
 * 1. `note_source == 'adjuster'`, never the text. EVERY group ships with a
 *    note -- `derived` is the default, a fusion of member photo notes like
 *    "master bedroom | by the window". Letting that become the search query
 *    would price the room. So a set with a note is not a set that is rescued.
 * 2. `.strip() or None` -- a whitespace-only note rescues NOTHING. Telling the
 *    adjuster "your note will be used" over "   " promises pricing that will
 *    not happen, and it fails silently: the line just arrives needs_manual.
 */
export function hasPricingNote(
  group: Pick<StagingGroup, 'note' | 'note_source'>,
): boolean {
  return group.note_source === 'adjuster' && (group.note ?? '').trim().length > 0
}

/**
 * A set clustering could not validate, that nothing will rescue at promote.
 *
 * These are the ones the adjuster still has to act on: at promote they price
 * from a barcode or an adjuster note or not at all.
 */
export function needsRescueNote(group: StagingGroup): boolean {
  return !!group.vision_fallback && group.kind === 'item' && !hasPricingNote(group)
}

/**
 * Notes a MERGE or SPLIT will destroy.
 *
 * A rescue note is not permanent, and neither action says so in the gesture:
 *
 * - **Merge with two or more authored notes** discards all of them. There is
 *   no non-arbitrary way to pick whose sentence survives, so the merged set
 *   falls back to derived. (With exactly one, the backend carries it -- see
 *   b76133d.)
 * - **Split** gives every fragment `note_source: derived`. The sentence
 *   described a set that no longer exists; asserting it of each fragment would
 *   fabricate notes the adjuster never wrote.
 *
 * Either way the adjuster's own words go, and on a `vision_fallback` set that
 * is the difference between a line that prices and one that arrives
 * `needs_manual`. Same reasoning as confirming a paid-link revoke: the
 * destructive part is not visible in the gesture.
 */
export function authoredNotesLostOnMerge(groups: StagingGroup[]): number {
  const authored = groups.filter(hasPricingNote)
  return authored.length >= 2 ? authored.length : 0
}

/** Splitting always drops the set's authored note. */
export function authoredNoteLostOnSplit(group: StagingGroup): boolean {
  return hasPricingNote(group) && group.photos.length > 1
}

/** A photo can be grouped only once extraction has finished. */
export function isActionable(photo: StagingPhoto): boolean {
  return photo.status !== 'uploaded'
}

/** Photos blocking every grouping path, and therefore every 409. */
export function pendingPhotos(session: StagingSessionFull | undefined): StagingPhoto[] {
  if (!session) return []
  const inGroups = (session.groups ?? []).flatMap((g) => g.photos)
  return [...inGroups, ...session.ungrouped_photos].filter((p) => !isActionable(p))
}

/**
 * Why a grouping action is unavailable, or null when it is available.
 *
 * Encoded rather than discovered: `cluster` is blocked once anything has been
 * arranged by hand, because re-clustering REBUILDS the session and would
 * silently discard that work.
 */
export function clusterBlockedReason(
  session: StagingSessionFull | undefined,
  manuallyEdited: boolean,
): string | null {
  if (!session) return 'No staging session yet.'
  if (session.photo_count === 0) return 'No photos uploaded yet.'
  const pending = pendingPhotos(session)
  if (pending.length) return `${pending.length} photo(s) still extracting — clustering would 409.`
  if (manuallyEdited)
    return 'Sets have been arranged by hand. Re-clustering rebuilds the session and would discard that work — use “Cluster remaining” for late photos.'
  return null
}

export function remainderBlockedReason(session: StagingSessionFull | undefined): string | null {
  if (!session) return 'No staging session yet.'
  if (session.ungrouped_photos.length === 0) return 'Every photo is already in a set.'
  const pending = session.ungrouped_photos.filter((p) => !isActionable(p))
  if (pending.length) return `${pending.length} unassigned photo(s) still extracting.`
  return null
}

/** ids for the batch thumbnail endpoint, capped at the API's 100 per call. */
export function thumbnailBatches(ids: number[]): number[][] {
  const batches: number[][] = []
  for (let i = 0; i < ids.length; i += THUMB_BATCH) batches.push(ids.slice(i, i + THUMB_BATCH))
  return batches
}

