/**
 * Purchase receipts → line items (FRONTEND.md §5e, backend 2026-11-20).
 *
 * For a total loss where the items are gone, the adjuster uploads the insured's
 * purchase receipts and each receipt item becomes a worksheet line. The receipt
 * IS the line: printed description, regular unit price, age from the purchase
 * date. Nothing is searched, there is no Source Link, and it never counts
 * toward the plan.
 *
 * Import-free so Node can load it for `npm run test:receipts`.
 *
 * NOT to be confused with the REPLACEMENT receipt on one line
 * (`POST /v1/claim_items/{id}/receipt`, holdback recovery, evidence.ts) --
 * that one touches no valuation field and creates nothing.
 */

/** What the picker offers. The server expands a .zip itself. */
export const RECEIPTS_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,application/zip,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.zip'

const RECEIPT_FILE = /\.(jpe?g|png|webp|heic|heif|pdf|zip)$/i
/** OS junk beside a folder of scans. Filtered locally, never sent. */
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$|\._)/i

/** Keep what the route reads; anything else is counted, never silently lost. */
export function keepReceiptFiles<T extends { name: string }>(files: T[]): { kept: T[]; skipped: T[] } {
  const kept: T[] = []
  const skipped: T[] = []
  for (const f of files) (RECEIPT_FILE.test(f.name) && !JUNK.test(f.name) ? kept : skipped).push(f)
  return { kept, skipped }
}

/**
 * The route takes up to 100 receipts a request (`MAX_RECEIPTS_PER_UPLOAD`);
 * the gateway is the real ceiling, as with photos (a ~160 MB body ran past
 * two minutes and 502'd), so chunks stay well under both. A file over the byte
 * bound still gets its own chunk -- the server rejects it by name.
 */
export const RECEIPT_CHUNK_FILES = 20
export const RECEIPT_CHUNK_BYTES = 65 * 1024 * 1024

export function planReceiptChunks<T extends { size: number }>(files: T[]): T[][] {
  const chunks: T[][] = []
  let current: T[] = []
  let bytes = 0
  for (const file of files) {
    if (current.length && (current.length >= RECEIPT_CHUNK_FILES || bytes + file.size > RECEIPT_CHUNK_BYTES)) {
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

/* ── Wire shapes ─────────────────────────────────────────────────────────── */

export type ReceiptRejection = { filename: string; reason: string; detail?: string | null }

/** `POST /v1/claims/{id}/receipts` → 202. `batch_id` is null when nothing was accepted. */
export type ReceiptUploadAck = {
  batch_id: string | null
  accepted: number
  rejected: ReceiptRejection[]
  max_upload_bytes?: number
}

export type ReceiptStatus = 'read' | 'not_a_receipt' | 'failed' | string

export type ReceiptProgress = {
  index: number
  filename: string
  /** Absent while the receipt is still being read. */
  status?: ReceiptStatus | null
  lines: number
  flagged: number
  store?: string | null
  purchase_date?: string | null
  date_readable?: boolean | null
  detail?: string | null
  item_ids?: number[]
}

/** `GET /v1/claims/{id}/receipts/{batch_id}`. Kept 48 h. */
export type ReceiptBatch = {
  batch_id: string
  total: number
  done: number
  finished: boolean
  lines: number
  flagged: number
  failed: number
  receipts: ReceiptProgress[]
}

/* ── Rejections ──────────────────────────────────────────────────────────── */

/**
 * Same closed set as photo uploads, worded for receipts. `duplicate` is not a
 * failure -- the receipt is already on the claim and re-sending never doubles
 * lines -- so it is listed quietly rather than in the red panel.
 */
const REJECT_TEXT: Record<string, string> = {
  duplicate: 'already on this claim',
  empty_file: 'arrived empty and could not be read',
  oversized_photo: 'is over the per-file limit',
  oversized_dimensions: 'is too large to process — rescan at a lower resolution',
  undecodable_image: 'could not be opened as an image or PDF',
  unsupported_format: 'is not a supported file — use JPEG, PNG, HEIC or PDF',
  storage_error: 'hit a storage hiccup — upload it again',
}

/** Display copy for one rejection. An unknown code shows the server's detail, never a raw enum. */
export function receiptRejectText(r: ReceiptRejection): string {
  const known = REJECT_TEXT[r.reason]
  if (r.reason === 'oversized_photo' && r.detail) return `${known} — ${r.detail}`
  return known ?? r.detail ?? 'could not be uploaded'
}

export function splitRejections(rejected: ReceiptRejection[]): {
  duplicates: ReceiptRejection[]
  failed: ReceiptRejection[]
} {
  const duplicates: ReceiptRejection[] = []
  const failed: ReceiptRejection[] = []
  for (const r of rejected) (r.reason === 'duplicate' ? duplicates : failed).push(r)
  return { duplicates, failed }
}

/* ── Progress ────────────────────────────────────────────────────────────── */

export type ReceiptTotals = {
  total: number
  done: number
  lines: number
  flagged: number
  failed: number
  finished: boolean
}

/** One upload can span several chunks, so several batches; the adjuster sees one tally. */
export function sumBatches(batches: (ReceiptBatch | undefined)[], expected: number): ReceiptTotals {
  const t: ReceiptTotals = { total: 0, done: 0, lines: 0, flagged: 0, failed: 0, finished: true }
  let seen = 0
  for (const b of batches) {
    if (!b) {
      t.finished = false
      continue
    }
    seen += 1
    t.total += b.total
    t.done += b.done
    t.lines += b.lines
    t.flagged += b.flagged
    t.failed += b.failed
    if (!b.finished) t.finished = false
  }
  if (seen < expected) t.finished = false
  return t
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "Reading receipts: 3 of 8 · 21 lines added · 2 need review" */
export function progressLine(t: ReceiptTotals): string {
  const head = t.finished
    ? `Read ${plural(t.total, 'receipt')}`
    : `Reading receipts: ${t.done} of ${t.total}`
  const parts = [head, `${plural(t.lines, 'line')} added`]
  if (t.flagged) parts.push(`${t.flagged} need${t.flagged === 1 ? 's' : ''} review`)
  if (t.failed) parts.push(`${t.failed} could not be read`)
  return parts.join(' · ')
}

/** One receipt's row, in words. */
export function receiptStatusText(r: ReceiptProgress): string {
  switch (r.status) {
    case 'read': {
      const bits = [plural(r.lines, 'line') + ' added']
      if (r.flagged) bits.push(`${r.flagged} need${r.flagged === 1 ? 's' : ''} review`)
      if (r.date_readable === false) bits.push('purchase date unreadable — Age left blank')
      return bits.join(' · ')
    }
    case 'not_a_receipt':
      return 'Not a receipt, nothing added'
    case 'failed':
      return r.detail || 'Could not be read'
    case null:
    case undefined:
      return 'Reading…'
    default:
      return r.detail || r.status
  }
}

/* ── Item panel ──────────────────────────────────────────────────────────── */

/**
 * A PDF receipt has no thumbnail and its signed URL serves application/pdf --
 * the PATH ends in `.pdf` (the query string carries the signature). It must
 * render as a tile that opens in a new tab, never an <img>.
 */
export function isPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const path = url.split(/[?#]/, 1)[0] ?? ''
  return /\.pdf$/i.test(path)
}

/** "11/03/2024" from an ISO date; the raw string if it is not one. */
export function fmtReceiptDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  return m ? `${m[2]}/${m[3]}/${m[1]}` : value.trim()
}
