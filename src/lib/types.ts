/** Mirrors kevin-backend schemas.py. Regenerate from /openapi.json when it drifts. */

export type MeResponse = {
  id: string
  email: string | null
  roles: string[]
  is_admin: boolean
}

/** Derived by the backend from item states + an export marker -- never settable. */
export type ClaimStatus = 'draft' | 'processing' | 'in_review' | 'exported'

export type StatusCounts = {
  processing: number
  completed: number
  needs_manual: number
  failed: number
  overridden: number
}

export type ClaimSummary = {
  claim_id: string
  name: string
  status: ClaimStatus
  insured_name: string | null
  carrier: string | null
  policy_number: string | null
  claim_number: string | null
  loss_type: string | null
  date_of_loss: string | null
  loss_address: string | null
  /** A fraction: 0.0825 = 8.25%. */
  tax_rate: number | null
  exported_at: string | null
  item_count: number
  /** Tax-inclusive sums of the per-line worksheet totals. Read verbatim. */
  total_rcv: number | null
  total_acv: number | null
  status_counts: StatusCounts
  created_at: string
  updated_at: string
}

export type ClaimListResponse = {
  claims: ClaimSummary[]
  count: number
  limit: number
  offset: number
}
