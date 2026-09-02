import { api } from './api'
import { captureHeader } from './pairing'
import type { CaptureToken } from './pair-rules'
import type { StagingUploadAck } from './mutations'

/**
 * The phone's credential, and the two calls it is allowed to make.
 *
 * Stored in sessionStorage, NOT localStorage: this is a bearer credential for
 * someone else's claim photos, and it should die with the tab rather than sit
 * on a phone that gets handed around. It is short-lived server-side anyway --
 * losing it costs one scan.
 */

const KEY = 'kevin.capture'

export function saveCredential(cred: CaptureToken): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cred))
  } catch {
    // Private mode, or storage disabled. The session still works in memory for
    // as long as the page lives; it just will not survive a reload.
  }
}

export function loadCredential(): CaptureToken | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CaptureToken
    return parsed?.capture_token && parsed?.claim_id ? parsed : null
  } catch {
    return null
  }
}

export function clearCredential(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}

/**
 * Upload a batch as the phone.
 *
 * Same route the desktop uses; the only difference is the credential. `room` is
 * per BATCH -- one room per request, which is why the queue splits batches on a
 * room change rather than sending a parallel per-photo array.
 */
export function captureUpload(
  cred: CaptureToken,
  files: File[],
  room: string | null,
): Promise<StagingUploadAck> {
  const form = new FormData()
  for (const file of files) form.append('images', file, file.name)
  if (room?.trim()) form.append('room', room.trim())
  return api.post<StagingUploadAck>(
    `/v1/claims/${encodeURIComponent(cred.claim_id)}/staging/photos`,
    { form, headers: captureHeader(cred.capture_token) },
  )
}

/**
 * Write one photo's note, after it is stored.
 *
 * Notes cannot ride the upload -- that route takes `images` and `room` only --
 * so this is a second call, and the second (and last) route a capture
 * credential is accepted on.
 */
export function captureNote(cred: CaptureToken, photoId: number, note: string) {
  return capturePatch(cred, photoId, { note })
}

/**
 * Fix one photo's room after it is stored.
 *
 * The same route as the note, and the reason review can DO something about a
 * photo shot before a room was set: PATCH semantics leave an omitted field
 * alone, so sending `{room}` cannot wipe a note typed on site.
 */
export function captureRoom(cred: CaptureToken, photoId: number, room: string | null) {
  return capturePatch(cred, photoId, { room })
}

function capturePatch(
  cred: CaptureToken,
  photoId: number,
  body: { note?: string; room?: string | null },
) {
  return api.patch<unknown>(
    `/v1/claims/${encodeURIComponent(cred.claim_id)}/staging/photos/${photoId}`,
    { json: body, headers: captureHeader(cred.capture_token) },
  )
}
