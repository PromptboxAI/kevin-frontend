import { ApiError, api } from './api'
import { API_BASE_URL } from './env'
import type { ItemPhoto } from './types'

/**
 * Row-level evidence: photos on a line, and the replacement receipt.
 *
 * Two DIFFERENT jobs that look similar and must not be merged:
 *
 * - **Photos** are claim evidence -- what the item was.
 * - **A receipt** is HOLDBACK-RECOVERY evidence, post-settlement: it proves the
 *   item was really replaced and for how much, which is what the carrier wants
 *   before releasing withheld depreciation.
 *
 * Critically, the receipt route "touches no valuation field". Attaching a PDF
 * does NOT set `claimed_rcv` -- that is a separate, deliberate assertion by the
 * adjuster. The schedule is what the carrier reconciles the holdback against,
 * so it must not move because a file arrived.
 */

export type PhotoAttachAck = {
  status: string
  row_id: number
  photo_id: number
  is_primary?: boolean
  photos?: ItemPhoto[]
}

export type ReceiptAck = {
  status: string
  row_id: number
  content_type: string
  receipt_url: string | null
}

export type AttachPhotosAck = {
  status: string
  row_id: number
  attached?: number
  detached?: number
  photos?: ItemPhoto[]
}

/** Multipart uploads bypass request() -- it sets a JSON content type. */
async function upload<T>(path: string, field: string, file: File): Promise<T> {
  const { data } = await (await import('./supabase')).getSupabase().auth.getSession()
  const token = data.session?.access_token
  const form = new FormData()
  form.append(field, file)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!response.ok) {
    let detail: unknown = response.statusText
    try {
      detail = (await response.json()).detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, detail, response.headers.get('X-Request-ID'))
  }
  return (await response.json()) as T
}

/** Staple a NEW photo onto a finished row. Field name is `image`. */
export function attachItemPhoto(rowId: number, file: File) {
  return upload<PhotoAttachAck>(`/v1/claim_items/${rowId}/photo`, 'image', file)
}

/**
 * Unpoint photos WITHOUT deleting them.
 *
 * The undo for a mis-attach, never a delete: tidying a gallery must not blank
 * the grid row as a side effect.
 */
export function detachItemPhotos(rowId: number, photoIds: number[]) {
  return api.delete<AttachPhotosAck>(`/v1/claim_items/${rowId}/photos`, {
    json: { photo_ids: photoIds },
  })
}

/**
 * The replacement receipt. Field name is `receipt`.
 *
 * PDFs are accepted here and NOWHERE else in the API: forwarded email invoices
 * arrive as PDFs, and the image pipeline cannot decode one -- it would store
 * bytes that serve back as an unopenable download. HEIC is normalised to JPEG
 * server-side with EXIF stripped, which matters more here than on contents
 * evidence: receipts are photographed at home.
 *
 * One per line item; re-uploading replaces the pointer.
 */
export function uploadReceipt(rowId: number, file: File) {
  return upload<ReceiptAck>(`/v1/claim_items/${rowId}/receipt`, 'receipt', file)
}

export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,application/pdf,.pdf,.heic'
