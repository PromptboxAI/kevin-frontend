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
