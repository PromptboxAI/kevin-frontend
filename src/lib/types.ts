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
  /** Every photo on the claim -- staged AND directly attached. */
  photo_count: number
  archived_at: string | null
  closed_at: string | null
  staging_status: string | null
  /** Tax-inclusive sums of the per-line worksheet totals. Read verbatim. */
  total_rcv: number | null
  total_acv: number | null
  /** Shipped a004e82 / migration 0037 -- no longer restated client-side. */
  total_tax: number | null
  total_depreciation: number | null
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

/** status on a worksheet row. */
export type ItemStatus = 'processing' | 'completed' | 'failed' | 'overridden' | 'needs_manual'

/** Why a row is unpriced. quota_/budget_exhausted are CAPACITY waits, not adjuster work. */
export type ManualReason =
  | 'manual_class' | 'luxury_brand' | 'low_sample' | 'no_comps' | 'no_query'
  | 'no_description' | 'vision_unavailable' | 'low_confidence_high_value'
  | 'valuation_error' | 'quota_exhausted' | 'budget_exhausted'
  | 'placeholder_row' | 'not_priced' | 'enqueue_failed'

/** The two reasons that mean "the pricing service is throttled", not "act on this". */
export const CAPACITY_REASONS: ReadonlySet<string> = new Set(['quota_exhausted', 'budget_exhausted'])

export type Comp = { title?: string; source?: string; price?: number | string; link?: string }

export type ClaimItem = {
  id: number
  claim_id: string
  room_id: number | null
  status: ItemStatus
  manual_reason: ManualReason | null
  valuation_basis: 'retail' | 'like_kind_new' | 'comparable_sale' | 'manual' | null
  is_manually_queried: boolean
  category: string | null
  query: string | null
  room_area: string | null
  make_mfr: string | null
  model_number: string | null
  description: string | null
  quantity: number
  /** PER-UNIT, PRE-TAX. The worksheet money columns are the *_incl fields. */
  rcv: number | null
  acv: number | null
  tax: number | null
  rcv_total_incl: number | null
  depreciation_amount: number | null
  acv_total_incl: number | null
  /** A FRACTION: 0.30 = 30%. */
  depreciation_pct: number | null
  depreciation_method: 'straight_line' | 'bracketed' | 'custom' | null
  pcs_code: string | null
  confidence: number | null
  age_years: number | null
  alternative_sources: Comp[]
  /**
   * The adjuster's own proof URL, for lines Kevin did not price (or whose
   * comps were dropped by a manual price). Set through the DESCRIPTIVE patch,
   * so it never touches valuation.
   */
  manual_source_url: string | null
  error: string | null
  created_at: string | null
  updated_at: string | null
}

export type ClaimItemListResponse = {
  items: ClaimItem[]
  /** TOTAL matching rows, not just this page. */
  count: number
  limit: number
  offset: number
}

/** One capture backing a line item. Carries NO image_url by design. */
export type ItemPhoto = {
  photo_id: number
  is_primary: boolean
  note: string | null
  room: string | null
}

export type ClaimItemDetail = ClaimItem & {
  depreciation_rule_version: string | null
  market_comp: number | null
  ceiling_used: number | null
  dep_manual: number | null
  /** ADJUSTER-FACING ONLY. Never export it, never present it as a warning. */
  substitution_note: string | null
  valuation_engine_version: string | null
  overridden_by: string | null
  overridden_at: string | null
  override_reason: string | null
  /** Short-lived (~5 min) signed URL. Do not persist. */
  image_url: string | null
  /** Empty is NORMAL -- single-photo and written-import items never stage. */
  photos: ItemPhoto[]
}

export type ThumbnailsResponse = {
  thumbnails: { id: number; image_url: string | null }[]
}
