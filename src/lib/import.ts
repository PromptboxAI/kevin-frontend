import { ApiError, api } from './api'
import { API_BASE_URL } from './env'
import type { BulkRow, ParsedRow } from './import-rules'

/**
 * Written-inventory import. Parse -> map -> preview -> import.
 *
 * Parsing is SERVER-SIDE and always will be: real total-loss inventories are
 * PDFs, which are positional rather than headed, and a browser parser would
 * have to reimplement that badly. Every format comes back in one shape so the
 * mapping UI has a single code path.
 */

export type ParseResponse = {
  format: 'pdf' | 'csv' | 'xlsx' | 'xls'
  filename: string | null
  headers: string[]
  rows: ParsedRow[]
  row_count: number
  heading_count: number
  /** field -> column index. PARTIAL by design; a visible guess beats a silent one. */
  suggested_mapping: Record<string, number>
}

export type PreviewRow = {
  index: number
  /** Identity-first, as it will be SEARCHED and shown -- not the bare cell. */
  description: string
  room: string | null
  quantity: number
  category: string | null
  age_years: number | null
  make_mfr: string | null
  model_number: string | null
  will_price: boolean
  reason: string | null
}

export type PreviewResponse = {
  claim_id: string
  total_rows: number
  priceable: number
  needs_manual: number
  /** Category drives depreciation; these value but depreciate poorly. */
  uncategorised: number
  /** Comp search PLUS merchant-link resolution per item -- not the row count. */
  estimated_searches: number
  rows: PreviewRow[]
  would_truncate: boolean
  would_drop: number
}

export type ImportAck = {
  claim_id: string
  items_created: number
  item_ids: number[]
  priced: number
  needs_manual: number[]
  /** Quota ran out mid-file. The rows are still in the adjuster's own file. */
  truncated: boolean
}

/** Multipart: request() sets a JSON content type. */
export async function parseInventory(claimId: string, file: File): Promise<ParseResponse> {
  const { data } = await (await import('./supabase')).getSupabase().auth.getSession()
  const token = data.session?.access_token
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/v1/claims/${encodeURIComponent(claimId)}/items/parse`,
    { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form },
  )
  if (!response.ok) {
    let detail: unknown = response.statusText
    try {
      detail = (await response.json()).detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, detail, response.headers.get('X-Request-ID'))
  }
  return (await response.json()) as ParseResponse
}

/**
 * THE dry run. Creates nothing, spends nothing, safe to call as often as the
 * UI needs. `price:false` on the import route is NOT this -- it still inserts.
 */
export function previewImport(claimId: string, items: BulkRow[]) {
  return api.post<PreviewResponse>(
    `/v1/claims/${encodeURIComponent(claimId)}/items/bulk/preview`,
    { json: { items } },
  )
}

/** Creates rows. Capped at 500 per call -- page through deliberately. */
export function importItems(claimId: string, items: BulkRow[], price: boolean) {
  return api.post<ImportAck>(`/v1/claims/${encodeURIComponent(claimId)}/items/bulk`, {
    json: { items, price },
  })
}

export const PARSE_ACCEPT =
  '.pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
