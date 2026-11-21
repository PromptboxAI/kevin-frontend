import { ApiError, api } from './api'
import { MAX_CHUNK_ATTEMPTS, chunkRetryDelayMs, isTransientUploadFailure } from './upload'
import {
  planReceiptChunks,
  type ReceiptBatch,
  type ReceiptRejection,
  type ReceiptUploadAck,
} from './receipt-rules'

/**
 * Purchase receipts → line items (FRONTEND.md §5e).
 *
 * The SERVER expands a .zip (entries come back as "box.zip/name.jpg"), so
 * unlike photos the archive is posted whole. Uploads are chunked for the
 * gateway, and each accepted chunk gets its own `batch_id` to poll.
 */

const path = (claimId: string) => `/v1/claims/${encodeURIComponent(claimId)}/receipts`

export function postReceipts(claimId: string, files: File[]): Promise<ReceiptUploadAck> {
  const form = new FormData()
  for (const f of files) form.append('files', f, f.name)
  return api.post<ReceiptUploadAck>(path(claimId), { form })
}

export function getReceiptBatch(claimId: string, batchId: string): Promise<ReceiptBatch> {
  return api.get<ReceiptBatch>(`${path(claimId)}/${encodeURIComponent(batchId)}`)
}

export type ReceiptUploadResult = {
  batchIds: string[]
  accepted: number
  rejected: ReceiptRejection[]
  /** Files whose chunk never reached the server -- offered for another try. */
  unsent: File[]
  error: string | null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Send every chunk. A transient failure (5xx, 429, network) retries with
 * backoff; a 413 halves the chunk; anything else stops that chunk and keeps
 * its files as `unsent` so nothing disappears. Re-sending is safe: the server
 * answers `duplicate` for a receipt already on the claim.
 */
export async function uploadReceipts(
  claimId: string,
  files: File[],
  onChunk?: (sent: number, total: number) => void,
): Promise<ReceiptUploadResult> {
  const result: ReceiptUploadResult = { batchIds: [], accepted: 0, rejected: [], unsent: [], error: null }
  const queue = planReceiptChunks(files)
  let sent = 0
  onChunk?.(0, files.length)

  while (queue.length) {
    const chunk = queue.shift()!
    for (let attempt = 1; ; attempt++) {
      try {
        const ack = await postReceipts(claimId, chunk)
        if (ack.batch_id) result.batchIds.push(ack.batch_id)
        result.accepted += ack.accepted
        result.rejected.push(...(ack.rejected ?? []))
        break
      } catch (e) {
        const status = e instanceof ApiError ? e.status : undefined
        if (status === 413 && chunk.length > 1) {
          const mid = Math.ceil(chunk.length / 2)
          queue.unshift(chunk.slice(0, mid), chunk.slice(mid))
          break
        }
        if (isTransientUploadFailure(status) && attempt < MAX_CHUNK_ATTEMPTS) {
          await sleep(chunkRetryDelayMs(attempt, e instanceof ApiError ? e.retryAfter : null))
          continue
        }
        result.unsent.push(...chunk)
        result.error =
          status === 404
            ? 'Receipt upload is not available on the server yet.'
            : e instanceof ApiError
              ? `The upload failed (HTTP ${status}${e.requestId ? ` · reference ${e.requestId}` : ''}).`
              : 'The upload failed — check your connection.'
        break
      }
    }
    sent += chunk.length
    onChunk?.(Math.min(sent, files.length), files.length)
  }
  return result
}
