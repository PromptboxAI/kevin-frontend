import { api } from './api'
import { SAMPLE_CLAIM_ID, previewEdit } from './worksheet-preview'
import type { ClaimItem } from './types'

/**
 * Every line-money recomputation goes through PATCH …/override. Apply the four
 * returned totals verbatim -- never re-derive them client-side.
 */
export type OverrideBody = {
  rcv?: number
  acv?: number
  category?: string
  age_years?: number
  depreciation_method?: 'straight_line' | 'bracketed' | 'custom'
  dep_manual?: number
  quantity?: number
  room_area?: string
  make_mfr?: string
  model_number?: string
  description?: string
  /** Optional by contract -- never prompt for it, never auto-fill a default. */
  reason?: string
}

/**
 * The tax-inclusive block both write paths now return (b443ee5 / 091dc33).
 * Pinned server-side against a subsequent GET, so applying it is not a guess:
 * a divergence is a build failure over there, not a flicker over here.
 */
export type ClaimTotals = {
  item_count: number
  total_rcv: number
  total_acv: number
  total_tax: number
  total_depreciation: number
}

export type MoneyBlock = {
  tax: number | null
  ext_cost: number | null
  rcv_total_incl: number | null
  depreciation_amount: number | null
  acv_total_incl: number | null
  recoverable?: number
  /**
   * The claim-level totals, computed server-side on the same write (e8d7d4b).
   * Null when the rollup could not be read -- the edit still succeeded, so the
   * client keeps its previous totals rather than blanking them.
   */
  claim_totals?: ClaimTotals | null
}

export type OverrideResponse = MoneyBlock & {
  status: string
  row_id: number
  /** The raw stored fields: per-unit rcv/acv, category, depreciation_pct, manual_reason. */
  applied: Partial<ClaimItem> & { status?: string }
  diff?: Record<string, { from: unknown; to: unknown }>
}

/**
 * `current` is only consulted for the PUBLIC SAMPLE CLAIM, which is signed out
 * and cannot write: the override would 401 and the row's derived money would
 * silently go stale. There the edit is held locally and priced by
 * `GET /v1/worksheet/preview`, which runs the server's real money chain and
 * stores nothing, so the demo cannot disagree with the product.
 *
 * The branch is on the ROW's `claim_id`, not on the URL. The payload already
 * says which claim a row belongs to, so there is no window/route dependency
 * and nothing to keep in sync with the router.
 *
 * Every other claim takes the write path unchanged.
 */
export async function overrideItem(
  rowId: number,
  body: OverrideBody,
  current?: ClaimItem,
  taxRate?: number | null,
): Promise<OverrideResponse> {
  if (current?.claim_id === SAMPLE_CLAIM_ID) {
    const money = await previewEdit(current, body, taxRate ?? 0)
    return {
      status: 'preview',
      row_id: rowId,
      // The fields the adjuster actually changed, echoed back the way the
      // write path echoes them, so the caller's cache update is identical.
      applied: {
        ...body,
        ...(money?.depreciation_pct != null
          ? { depreciation_pct: money.depreciation_pct }
          : {}),
      } as OverrideResponse['applied'],
      tax: money?.tax ?? null,
      ext_cost: money?.ext_cost ?? null,
      rcv_total_incl: money?.rcv_total_incl ?? null,
      depreciation_amount: money?.depreciation_amount ?? null,
      acv_total_incl: money?.acv_total_incl ?? null,
      // Totals are a claim-wide rollup the preview endpoint does not compute.
      // Null means "keep what you had" to the caller, which is right: one
      // unsaved demo edit should not restate the claim header.
      claim_totals: null,
    }
  }
  return api.patch<OverrideResponse>(`/v1/claim_items/${rowId}/override`, { json: body })
}

/**
 * Descriptive edits only -- does NOT touch rcv/acv/status and does not mark the
 * row overridden. This is the right call for Room/Area and identity text.
 */
export type DisplayBody = {
  description?: string | null
  make_mfr?: string | null
  model_number?: string | null
  room_area?: string | null
  /** Adjuster-supplied proof URL (max 2000). null clears it. */
  manual_source_url?: string | null
}

/** The edit receipt carries the same money block, so one shape covers both paths. */
export type ClaimItemEditResponse = MoneyBlock & {
  status: string
  row_id: number
  applied: Record<string, unknown>
}

export function editDisplayLine(rowId: number, body: DisplayBody) {
  return api.patch<ClaimItemEditResponse>(`/v1/claim_items/${rowId}`, { json: body })
}

export type BulkDeleteResponse = {
  status: string
  deleted: number
  item_ids: number[]
  /** NO photo is ever deleted -- these came loose. Surface as "N photos kept". */
  photos_detached: number
}

export function deleteItems(itemIds: number[]) {
  return api.delete<BulkDeleteResponse>('/v1/claim_items', { json: { item_ids: itemIds } })
}

export type RepriceResponse = {
  status: string
  row_id: number
  job_id: string
  query: string
}

/**
 * Re-runs the whole pricing pipeline on a refined query. Shares the /process
 * rate limit (30/min), so callers must sequence rather than fan out.
 */
export function repriceItem(
  rowId: number,
  body: { query: string; category?: string; make_mfr?: string; model_number?: string; description?: string },
) {
  return api.post<RepriceResponse>(`/v1/claim_items/${rowId}/reprice`, { json: body })
}

export type BulkCreateResponse = {
  claim_id: string
  items_created: number
  item_ids: number[]
  priced: number
  needs_manual: number[]
}

/**
 * A one-row bulk call is the ONLY row-creation route that does not require an
 * uploaded image -- the contract says so explicitly. price:false creates the
 * line without spending vendor budget, so it lands unpriced for the adjuster
 * to fill in.
 */
export function createBlankItem(claimId: string, description = 'New item') {
  return api.post<BulkCreateResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/items/bulk`,
    { json: { items: [{ description, quantity: 1 }], price: false } },
  )
}

/** close/reopen/archive/unarchive all take NO body and return the derived status. */
export type ClaimStateResponse = {
  status: string
  claim_id: string
  closed_at: string | null
  archived_at: string | null
}

export function claimAction(
  claimId: string,
  action: 'close' | 'reopen' | 'archive' | 'unarchive',
) {
  return api.post<ClaimStateResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/${action}`,
  )
}

/** Deep-copies metadata, rooms and every item. A taken new_claim_id -> 409. */
export function duplicateClaim(claimId: string, body: { new_claim_id?: string; name?: string }) {
  return api.post<{ claim_id: string; name: string }>(
    `/v1/claims/${encodeURIComponent(claimId)}/duplicate`,
    { json: body },
  )
}

export type DeleteClaimResponse = {
  status: string
  claim_id: string
  deleted_items: number
  /**
   * FILES, not photos (backend 6db3299): a staged photo is two files
   * (original + grid thumbnail), and receipts and delivered documents count
   * too. Never render this as "N photos".
   */
  deleted_files?: number
  /** Files kept because a duplicate of this claim still uses them. */
  kept_shared?: number
  /** Storage was briefly down; queued for cleanup. Not an error -- never shown. */
  queued_files?: number
}

/**
 * Cascades to items and rooms, AND deletes the claim's stored files (backend
 * 6db3299) -- except files a duplicate still shares, which go when the last
 * claim using them is deleted.
 */
export function deleteClaim(claimId: string) {
  return api.delete<DeleteClaimResponse>(`/v1/claims/${encodeURIComponent(claimId)}`)
}

/**
 * Re-run valuation on lines that were DEFERRED (a capacity stop) rather than
 * judged. Omitting `reasons` uses the server's capacity-only default, which is
 * the point: re-running "no comps" or "too thin a sample" spends two searches
 * to reach the same nil answer.
 */
export type RetryDeferredResponse = {
  claim_id: string
  dry_run: boolean
  reasons: string[]
  eligible: number
  enqueued: number
  skipped: number
  skipped_detail: Record<string, number>
  estimated_searches: number
}

export function retryDeferred(claimId: string, dryRun: boolean) {
  return api.post<RetryDeferredResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/retry-deferred`,
    { json: { dry_run: dryRun } },
  )
}

export type BulkCategoryResponse = {
  category: string
  updated?: number
  repriced: number
}

/**
 * One call instead of N /override calls -- which also stamped each row as an
 * adjuster price override it never was.
 */
export function bulkSetCategory(itemIds: number[], category: string) {
  return api.patch<BulkCategoryResponse>('/v1/claim_items/category', {
    json: { item_ids: itemIds, category },
  })
}

/** description may now be blank when price:false -- no create-then-clear. */
export function createBlankRow(claimId: string) {
  return api.post<BulkCreateResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/items/bulk`,
    { json: { items: [{ description: '', quantity: 1 }], price: false } },
  )
}

/**
 * Pull the six money columns off either write response. Both endpoints return
 * the same block, so the caller never branches on which one it hit.
 */
export function moneyFrom(response: MoneyBlock): Partial<ClaimItem> {
  return {
    tax: response.tax,
    ext_cost: response.ext_cost,
    rcv_total_incl: response.rcv_total_incl,
    depreciation_amount: response.depreciation_amount,
    acv_total_incl: response.acv_total_incl,
  }
}

export type StagingSession = {
  id: number
  claim_id: string
  status: 'uploading' | 'clustering' | 'review' | 'processed'
  photo_count: number
}

/** Idempotent: an active session is returned 200, a new one 201. */
export function startStagingSession(claimId: string) {
  return api.post<StagingSession>(`/v1/claims/${encodeURIComponent(claimId)}/staging`)
}

export type StagingUploadAck = {
  session_id: number
  uploaded: number
  photo_ids: number[]
  max_upload_bytes: number
  room: string | null
  rejected?: { filename: string; reason: string; detail?: string }[]
}

/**
 * multipart/form-data under the field name `images`, with an optional per-BATCH
 * `room`. Never a per-photo room array: it would mis-tag the moment it fell out
 * of step with `images` after a rejection. Two rooms = two requests.
 */
export function uploadStagingPhotos(claimId: string, files: File[], room?: string) {
  const form = new FormData()
  for (const file of files) form.append('images', file, file.name)
  if (room?.trim()) form.append('room', room.trim())
  return api.post<StagingUploadAck>(
    `/v1/claims/${encodeURIComponent(claimId)}/staging/photos`,
    { form },
  )
}
