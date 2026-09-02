/**
 * The phone's capture queue.
 *
 * What the phone can actually do is narrow, and deliberately so. The capture
 * credential is accepted on exactly TWO routes:
 *
 *   POST  /claims/{id}/staging/photos              upload, with a per-BATCH room
 *   PATCH /claims/{id}/staging/photos/{photo_id}   that photo's note and/or room
 *
 * It cannot read a worksheet, see money, or touch another claim — a token
 * for one claim used against another is a 403, not a 404, because the claim
 * match is the security boundary rather than the token's validity.
 *
 * Import-free so it can be tested.
 */

/** Per-photo note cap, per the backend contract. Staging SET notes stay 120. */
export const NOTE_MAX = 300

export type ShotState = 'queued' | 'uploading' | 'stored' | 'failed'

export type Shot = {
  /** Local id -- the server's photo_id only exists after a successful upload. */
  key: string
  name: string
  size: number
  /** Object URL for the thumbnail. Revoke it when the shot leaves the queue. */
  preview: string
  /** The room this shot was taken under. Captured PER SHOT so that changing */
  /** rooms mid-walk cannot retag photos already queued under the old one. */
  room: string | null
  note: string
  state: ShotState
  photoId?: number
  error?: string
}

/**
 * Trim a note to what the API will take.
 *
 * Silently, and at the edge rather than on submit: someone standing in a burnt
 * kitchen typing one-handed should not be handed a validation error for a
 * sentence that ran long.
 */
export function clampNote(text: string): string {
  return text.slice(0, NOTE_MAX)
}

/**
 * Group queued shots into upload requests.
 *
 * `room` is a per-BATCH form field, not per photo, so every shot in one request
 * must share a room -- a parallel per-photo array would mis-tag the moment it
 * fell out of step with `images` after a rejection. Two rooms therefore mean
 * two requests, and this is what splits them.
 *
 * Order is preserved so the queue uploads in the order it was shot.
 */
export function batchByRoom(shots: Shot[]): { room: string | null; shots: Shot[] }[] {
  const batches: { room: string | null; shots: Shot[] }[] = []
  for (const shot of shots) {
    const last = batches[batches.length - 1]
    if (last && last.room === shot.room) last.shots.push(shot)
    else batches.push({ room: shot.room, shots: [shot] })
  }
  return batches
}

/**
 * Which shots need a note written after upload.
 *
 * Notes cannot ride the upload -- it takes `images` and `room` and nothing else
 * -- so they are a second call per photo, and only for the photos that have
 * one. A blank note is not a write.
 */
export function notesToWrite(shots: Shot[]): { photoId: number; note: string }[] {
  return shots
    .filter((s) => s.state === 'stored' && s.photoId != null && s.note.trim() !== '')
    .map((s) => ({ photoId: s.photoId as number, note: s.note.trim() }))
}

export type QueueTally = {
  queued: number
  uploading: number
  stored: number
  failed: number
}

export function tallyQueue(shots: Shot[]): QueueTally {
  return {
    queued: shots.filter((s) => s.state === 'queued').length,
    uploading: shots.filter((s) => s.state === 'uploading').length,
    stored: shots.filter((s) => s.state === 'stored').length,
    failed: shots.filter((s) => s.state === 'failed').length,
  }
}

/**
 * What the status line says.
 *
 * Never "synced" while anything is still in flight, and never silent about a
 * failure. A phone that says "all done" over an unsent photo costs someone a
 * second trip to the property.
 */
export function queueStatus(tally: QueueTally): string {
  if (tally.failed > 0) {
    return `${tally.failed} didn’t send — tap to retry. ${tally.stored} safely uploaded.`
  }
  if (tally.uploading > 0 || tally.queued > 0) {
    const left = tally.uploading + tally.queued
    return `Sending ${left} photo${left === 1 ? '' : 's'}… ${tally.stored} uploaded.`
  }
  if (tally.stored > 0) return `${tally.stored} photo${tally.stored === 1 ? '' : 's'} uploaded.`
  return 'No photos yet.'
}

/**
 * Is it safe to walk away?
 *
 * The one question someone leaving a property actually has, and the reason the
 * queue is worth showing at all.
 */
export function safeToLeave(tally: QueueTally): boolean {
  return tally.queued === 0 && tally.uploading === 0 && tally.failed === 0
}

export type CaptureFailure = 'expired' | 'wrong_claim' | 'offline' | 'too_big' | 'unknown'

/**
 * Why an upload stopped, in the phone-holder's terms.
 *
 * `expired` and `wrong_claim` are different HTTP answers for a reason: 401 says
 * the credential died (pair again), 403 says it is valid but for another claim
 * (someone scanned the wrong screen). Collapsing them would send a person to
 * re-pair when re-pairing is not the problem.
 */
export const CAPTURE_FAILURE_COPY: Record<CaptureFailure, string> = {
  expired:
    'This phone is no longer signed in to the claim. Scan a fresh code on the computer — your uploaded photos are safe.',
  wrong_claim:
    'This code was for a different claim. Scan the code shown on the claim you are shooting.',
  offline: 'No connection. Your photos are still here — they will send when you retry.',
  too_big: 'That photo is larger than the claim accepts. Try again without any editing app in between.',
  unknown: 'That upload did not go through. Your photos are still here — tap retry.',
}

export function failureFor(status: number | undefined): CaptureFailure {
  if (status === 401) return 'expired'
  if (status === 403) return 'wrong_claim'
  if (status === 413) return 'too_big'
  if (status === undefined) return 'offline'
  return 'unknown'
}
