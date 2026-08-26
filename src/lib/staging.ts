import { api } from './api'

// The rules and types live in staging-rules.ts, which imports nothing so the
// 409 guards can be unit-tested. Re-exported here so callers have one import.
export type {
  PhotoStatus,
  StagingPhoto,
  GroupKind,
  StagingGroup,
  StagingTally,
  StagingSessionFull,
} from './staging-rules'
export {
  NOTE_MAX,
  THUMB_BATCH,
  isActionable,
  needsRescueNote,
  hasPricingNote,
  pendingPhotos,
  photoLabel,
  photoFilenames,
  clusterBlockedReason,
  remainderBlockedReason,
  thumbnailBatches,
} from './staging-rules'

import type { GroupKind, StagingSessionFull } from './staging-rules'

// --------------------------------------------------------------------------
// API
// --------------------------------------------------------------------------

export function getStaging(claimId: string) {
  return api.get<StagingSessionFull>(`/v1/claims/${encodeURIComponent(claimId)}/staging`)
}

export function runCluster(claimId: string) {
  return api.post<{ session_id: number; status: string }>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/cluster`,
  )
}

/** Groups ONLY unassigned photos and APPENDS -- never rebuilds the session. */
export function clusterRemainder(claimId: string) {
  return api.post<{ session_id: number; status: string }>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/cluster/remainder`,
  )
}

/**
 * Combine sets and/or loose photos. The merged set gets a NEW group_key and the
 * sources are pruned, so the returned session is the only truth -- never cache
 * the old key. `kind` is passed EXPLICITLY: it defaults to `item`, which would
 * silently convert a context or duplicate set.
 */
export function mergeGroups(
  claimId: string,
  body: { group_keys?: string[]; photo_ids?: number[]; kind: GroupKind },
) {
  return api.post<StagingSessionFull>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/groups/merge`,
    { json: body },
  )
}

/** Splits into one `item` set per photo. A merged note stays on the first child. */
export function ungroup(claimId: string, groupKey: string) {
  return api.post<StagingSessionFull>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/groups/${encodeURIComponent(groupKey)}/ungroup`,
  )
}

/** Excluding a set from the worksheet IS reclassifying it -- there is no skip. */
export function reclassifyGroup(claimId: string, groupKey: string, kind: GroupKind) {
  return api.patch<StagingSessionFull>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/groups/${encodeURIComponent(groupKey)}`,
    { json: { kind } },
  )
}

/** null or "" drops the override and the derived summary returns. */
export function setGroupNote(claimId: string, groupKey: string, note: string | null) {
  return api.patch<StagingSessionFull>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/groups/${encodeURIComponent(groupKey)}/note`,
    { json: { note } },
  )
}

export type ProcessResponse = {
  session_id: number
  items_created: number
  item_ids: number[]
  skipped_photos: number[]
}

/**
 * Posts NO BODY. Every merge, split, note and reclassification was already
 * written when the adjuster made it; process promotes whatever the database
 * already holds. There is no photo_sets payload and never was.
 */
export function processStaging(claimId: string) {
  return api.post<ProcessResponse>(`/v1/claims/${encodeURIComponent(claimId)}/staging/process`)
}

export function getThumbnails(ids: number[]) {
  return api.get<{ thumbnails: { id: number; image_url: string | null }[] }>(
    `/v1/staging/photos/thumbnails?ids=${ids.join(',')}`,
  )
}

export type StagingPhotoDeleteAck = {
  status: string
  photo_id: number
  session_id: number
  /** Photos left in the session, so the grid updates without a poll. */
  remaining: number
}

/**
 * Remove a staged photo BEFORE processing -- an accidental upload, or a
 * personal shot that came along with the camera roll.
 *
 * This is NOT a hole in "excluded, never deleted". That rule governs PROCESSED
 * evidence: once a photo is promoted onto a line item it is part of the claim
 * record. A raw upload sitting in staging is not yet evidence of anything.
 *
 * The API enforces exactly that, with 409s the caller must surface rather than
 * swallow: the photo is already promoted, the session is processed, or
 * clustering is running and would lose the race.
 */
export function deleteStagingPhoto(claimId: string, photoId: number) {
  return api.delete<StagingPhotoDeleteAck>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/photos/${photoId}`,
  )
}
