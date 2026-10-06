/**
 * How long is left on an upload, and how to say it.
 *
 * Import-free so it compiles and runs standalone under node for its tests.
 *
 * Why this exists: a 1.3 GB drop is thousands of photos and tens of minutes.
 * The queue showed rows flipping to "uploaded" one by one with no sense of
 * scale, so there was no way to tell a ten-minute upload from an hour-long one
 * — and no way to decide whether to sit and watch it.
 *
 * The honesty rules it enforces, which matter more than the arithmetic:
 *
 * 1. **No estimate before there is evidence for one.** A rate measured over the
 *    first second of a multi-gigabyte upload is noise, and a confident "about
 *    2 minutes left" that becomes "about 40 minutes left" is worse than having
 *    said nothing. `etaSeconds` returns null until enough has moved.
 * 2. **Round coarsely.** The estimate is not accurate to the second, so it must
 *    not be phrased as though it were. "about 12 min left", never "11:47".
 * 3. **Bytes, not files.** Counting files assumes they are the same size. On a
 *    real pack-out they are not.
 */

export type UploadProgress = {
  /** Bytes acknowledged by the server so far. */
  sentBytes: number
  /** Bytes in everything that will be sent. */
  totalBytes: number
  /** Milliseconds since the upload actually started moving. */
  elapsedMs: number
}

/**
 * Enough evidence for an estimate: a couple of seconds AND a visible slice of
 * the payload. Both, because either alone still produces nonsense — two
 * seconds into a 1.3 GB upload measures the first chunk's handshake, and 5% of
 * a tiny upload can land in 200ms.
 */
export const ETA_MIN_ELAPSED_MS = 4000
export const ETA_MIN_FRACTION = 0.02

/**
 * Seconds remaining, or null when it would be a guess. Null is a real answer
 * here and callers must render it as "estimating…", never as 0.
 */
export function etaSeconds(p: UploadProgress): number | null {
  const { sentBytes, totalBytes, elapsedMs } = p
  if (!Number.isFinite(sentBytes) || !Number.isFinite(totalBytes)) return null
  if (totalBytes <= 0 || sentBytes <= 0 || elapsedMs <= 0) return null
  if (sentBytes >= totalBytes) return 0
  if (elapsedMs < ETA_MIN_ELAPSED_MS) return null
  if (sentBytes / totalBytes < ETA_MIN_FRACTION) return null

  const bytesPerMs = sentBytes / elapsedMs
  if (bytesPerMs <= 0) return null
  return Math.round(((totalBytes - sentBytes) / bytesPerMs) / 1000)
}

/**
 * Coarse, honest wording. The buckets widen as the number grows because the
 * estimate gets less trustworthy the further out it reaches.
 */
export function fmtEta(seconds: number | null): string | null {
  if (seconds === null) return null
  if (seconds <= 0) return 'almost done'
  if (seconds < 45) return 'less than a minute left'
  const mins = Math.round(seconds / 60)
  if (mins <= 1) return 'about a minute left'
  if (mins < 60) return `about ${mins} min left`
  const hours = seconds / 3600
  if (hours < 1.5) return 'about an hour left'
  if (hours < 10) return `about ${Math.round(hours)} hours left`
  return 'over 10 hours left'
}

/** Bytes per second, for "4.2 MB/s" beside the bar. Null before it is known. */
export function bytesPerSecond(p: Pick<UploadProgress, 'sentBytes' | 'elapsedMs'>): number | null {
  if (p.elapsedMs < ETA_MIN_ELAPSED_MS || p.sentBytes <= 0) return null
  return p.sentBytes / (p.elapsedMs / 1000)
}

export function fmtRate(bytesPerSec: number | null): string | null {
  if (bytesPerSec === null || !Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return null
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytesPerSec
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}/s`
}

/**
 * The overall bar's fill, 0..1, measured in BYTES.
 *
 * The ring beside it counts FILES, and the two legitimately disagree — 900 of
 * 1000 small files can be a third of the payload. Bytes are what the time
 * remaining is derived from, so bytes are what the bar shows.
 */
export function byteFraction(p: Pick<UploadProgress, 'sentBytes' | 'totalBytes'>): number {
  if (p.totalBytes <= 0) return 0
  return Math.min(Math.max(p.sentBytes / p.totalBytes, 0), 1)
}
