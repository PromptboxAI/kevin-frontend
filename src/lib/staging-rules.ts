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
}

export type GroupKind = 'item' | 'context' | 'duplicate'

export type StagingGroup = {
  group_key: string
  kind: GroupKind
  reason: string | null
  confidence: number | null
  /** Fused by the backend. NEVER re-concatenate client-side. */
  note: string | null
  /** Branch on THIS, never on the note text. */
  note_source: 'derived' | 'adjuster' | null
  room: string | null
  photos: StagingPhoto[]
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

