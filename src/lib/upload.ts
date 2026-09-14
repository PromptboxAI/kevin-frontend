/**
 * Client-side chunking for a folder drop.
 *
 * The server caps 50 photos and 15 MB per file with no total-bytes cap, but the
 * GATEWAY is the real limit: a ~160 MB body ran past two minutes and returned a
 * 502, the client retried, and the already-saved photos came back as
 * duplicates. So the chunk size is a CLIENT choice, deliberately well under the
 * server's cap.
 */
export const CHUNK_FILES = 20
export const CHUNK_BYTES = 65 * 1024 * 1024

/** iPhone/Samsung shoot HEIC by default -- omitting these hides their photos. */
export const ACCEPT_TYPES =
  'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif'

export type Chunk<T> = T[]

/**
 * Pack files into chunks bounded by BOTH count and bytes. A single file over
 * the byte bound still gets its own chunk rather than being dropped -- the
 * server decides whether it is too big, and says so in `rejected`.
 */
export function planUploadChunks<T extends { size: number }>(files: T[]): Chunk<T>[] {
  const chunks: Chunk<T>[] = []
  let current: T[] = []
  let bytes = 0

  for (const file of files) {
    const over = current.length >= CHUNK_FILES || bytes + file.size > CHUNK_BYTES
    if (current.length && over) {
      chunks.push(current)
      current = []
      bytes = 0
    }
    current.push(file)
    bytes += file.size
  }
  if (current.length) chunks.push(current)
  return chunks
}

/**
 * Retrying a chunk that failed in TRANSIT -- a 5xx, a gateway 502/504, a 429, or
 * a network drop (fetch rejects with a TypeError, not an ApiError).
 *
 * Before this, anything but a 413 aborted the whole upload, and the next click
 * re-sent every photo from the start. Re-sending is SAFE -- claim-wide content
 * hashing turns repeats into `duplicate` -- but it re-posts hundreds of MB over
 * site wifi. So a chunk now gets a few tries with backoff, and a click after a
 * real failure resumes from the rows still pending rather than the whole drop.
 *
 * Phone capture already retries this way (capture-rules: 5 tries, 2s doubling
 * to a 30s ceiling). Desktop sits on steadier networks, so fewer, shorter tries.
 */
export const MAX_CHUNK_ATTEMPTS = 3

/** Wait before the next try: 2s, 4s, capped at 8s -- or the server's Retry-After. */
export function chunkRetryDelayMs(attempt: number, retryAfterSeconds?: number | null): number {
  if (retryAfterSeconds && retryAfterSeconds > 0) return Math.min(retryAfterSeconds * 1000, 60_000)
  return Math.min(8_000, 2_000 * 2 ** Math.max(0, attempt - 1))
}

/**
 * Is this failure worth another try? `status` is the HTTP status, or undefined
 * for a network failure that never got a response. A 4xx other than 408/429
 * will fail the same way again, so it stops.
 */
export function isTransientUploadFailure(status: number | undefined): boolean {
  if (status === undefined) return true
  return status >= 500 || status === 408 || status === 429
}

/** A 413 means the chunk was too big: halve it and retry the halves alone. */
export function splitChunk<T>(chunk: Chunk<T>): Chunk<T>[] {
  if (chunk.length <= 1) return [chunk]
  const mid = Math.ceil(chunk.length / 2)
  return [chunk.slice(0, mid), chunk.slice(mid)]
}

/** The closed enum. Never branch on `detail`, which is prose for display. */
export type RejectReason =
  | 'unsupported_format'
  | 'empty_file'
  | 'oversized_photo'
  | 'oversized_dimensions'
  | 'undecodable_image'
  | 'duplicate'
  | 'storage_error'

/**
 * What the wire actually carries. `reason` is typed as a plain string, not the
 * enum: the enum is the set we KNOW, and a code we have never seen is a
 * contract change that must reach the adjuster rather than fail a type check
 * and get dropped.
 */
export type Rejection = { filename: string; reason: string; detail?: string }

type RejectCopy = {
  /** duplicate is a SUCCESS: the photo is already safely in the session. */
  stored?: boolean
  /** Collapses into one quiet line instead of a red failure panel. */
  quiet?: boolean
  retryAuto?: boolean
  text: (filename: string, detail?: string) => string
}

export const REJECT_COPY: Record<RejectReason, RejectCopy> = {
  duplicate: { stored: true, text: () => 'already uploaded' },
  oversized_photo: {
    text: (n, d) => `${n} is over the per-photo limit${d ? ` — ${d}` : ''}`,
  },
  oversized_dimensions: { text: (n) => `${n} is too large to process — re-shoot or resize` },
  empty_file: { text: (n) => `${n} arrived empty and could not be read` },
  unsupported_format: { text: (n) => `${n} is not a supported image — export as JPEG or HEIC` },
  // How iOS .AAE edit-sidecars arrive. Alarming someone over invisible OS files
  // whose shoot was fine is a bug, so these collapse into one info line.
  undecodable_image: { quiet: true, text: () => 'non-image file' },
  storage_error: {
    retryAuto: true,
    text: (n) => `${n} hit a storage hiccup — Kevin retries this automatically`,
  },
}

export type UploadTally = {
  /** Photos safely in the session: accepted PLUS duplicates. */
  stored: number
  /** Quiet, non-actionable skips (sidecars) -- one info line, never a panel. */
  quiet: Rejection[]
  /** Real failures the adjuster may need to act on. */
  failed: Rejection[]
  /** Transient; the server retries these itself. */
  autoRetry: Rejection[]
}

/**
 * Reconcile one ack.
 *
 * `duplicate` is a SUCCESS reported on the rejection channel -- it means the
 * photo is already stored. Counting duplicates as failures once reported
 * "196 failed" for photos that were all safe, which is why they fold into
 * `stored` and never reach the failure panel.
 */
export function tallyUpload(acks: { uploaded: number; rejected?: Rejection[] }[]): UploadTally {
  const tally: UploadTally = { stored: 0, quiet: [], failed: [], autoRetry: [] }

  for (const ack of acks) {
    tally.stored += ack.uploaded
    for (const rejection of ack.rejected ?? []) {
      const copy = REJECT_COPY[rejection.reason as RejectReason]
      if (!copy) {
        // An unknown code is a contract change, not a silent drop.
        tally.failed.push(rejection)
        continue
      }
      if (copy.stored) tally.stored += 1
      else if (copy.quiet) tally.quiet.push(rejection)
      else if (copy.retryAuto) tally.autoRetry.push(rejection)
      else tally.failed.push(rejection)
    }
  }
  return tally
}

/** uploaded + rejected must always equal what was sent -- nothing is dropped. */
export function reconciles(sent: number, ack: { uploaded: number; rejected?: Rejection[] }): boolean {
  return ack.uploaded + (ack.rejected?.length ?? 0) === sent
}
