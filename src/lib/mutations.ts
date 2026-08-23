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
}

/** Cascades to items and rooms. Evidence images are left in storage. */
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
