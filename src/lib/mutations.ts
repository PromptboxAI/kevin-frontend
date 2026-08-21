import { api } from './api'
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

export type OverrideResponse = {
  status: string
  row_id: number
  applied: Partial<ClaimItem> & { status?: string }
  diff?: Record<string, { from: unknown; to: unknown }>
}

export function overrideItem(rowId: number, body: OverrideBody) {
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
}

export function editDisplayLine(rowId: number, body: DisplayBody) {
  return api.patch<ClaimItem>(`/v1/claim_items/${rowId}`, { json: body })
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
}

/** Cascades to items and rooms. Evidence images are left in storage. */
export function deleteClaim(claimId: string) {
  return api.delete<DeleteClaimResponse>(`/v1/claims/${encodeURIComponent(claimId)}`)
}
