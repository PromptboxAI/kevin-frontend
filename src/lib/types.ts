/** Mirrors kevin-backend schemas.py. Regenerate from /openapi.json when it drifts. */

/** The plan an account is actually on. `comped` is granted from the admin
 *  console: $0, full features, and it receives no Stripe events at all. */
export type BillingPlan = 'free' | 'pro' | 'enterprise' | 'comped'

/** Dunning state. Work is never blocked on it -- a past_due account keeps
 *  editing; billing problems are surfaced, not enforced mid-claim. */
export type BillingState = 'active' | 'past_due' | 'canceled' | 'suspended'

/**
 * Line items are the metered dimension (CLAUDE.md rule 9). The count is
 * APPEND-ONLY: it records items PRODUCED, not items kept, so deleting a row
 * never returns quota -- the pricing lookups behind it are already paid for.
 */
export type ItemUsage = {
  /** The plan's allowance. Free = 250 one-time; Pro = 2,000 a billing month. */
  included: number
  /** Purchased credits still unspent. ADDED to `included`, never replacing it. */
  credits: number
  used: number
}

export type MeResponse = {
  id: string
  email: string | null
  roles: string[]
  is_admin: boolean
  /**
   * Billing fields are OPTIONAL because the backend may not be serving them
   * yet. The UI renders what the payload carries (rule 20) and says plainly
   * when billing is unavailable, rather than inventing a plan.
   */
  plan?: BillingPlan
  items?: ItemUsage
  billing_state?: BillingState
  /** ISO date; null on the free tier, which has no billing period. */
  period_end?: string | null
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
/**
 * Statuses that mean the claim is off the working set.
 *
 * `closed` and `archived` are DERIVED and both outrank processing, so a shelved
 * claim can still have lines pricing. Defined once: two copies of this had
 * already appeared, and a divergent answer shows up as a menu offering
 * "Re-open" on a live claim.
 */
export const CLOSED_STATUSES: readonly string[] = ['closed', 'archived']

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
  /**
   * What vision read off the photos, post-promote and adjuster-facing.
   *
   * Deliberately NOT on the staging card (rule 23): a machine's guess at an
   * item's identity must not anchor the adjuster's read of a set before they
   * have reviewed it. Here, on a line that could not be priced, it is the
   * starting point for the description the line needs.
   */
  suggested_description?: string | null
  valuation_basis: 'retail' | 'like_kind_new' | 'comparable_sale' | 'manual' | null
  is_manually_queried: boolean
  category: string | null
  query: string | null
  room_area: string | null
  make_mfr: string | null
  model_number: string | null
  description: string | null
  quantity: number
  /**
   * HOLDBACK RECOVERY, post-settlement. `claimed_rcv` is what the insured
   * actually spent replacing the item and `replaced_qty` how many units --
   * PAIRED, because an amount without a count computes $0 recoverable on money
   * genuinely owed. `recoverable` is SERVER-computed
   * (max(0, min(rcv_total_incl, claimed_rcv) - acv_total_incl), with a partial
   * ratio); never derive it here.
   */
  claimed_rcv?: number | null
  replaced_qty?: number | null
  recoverable?: number
  /** The replacement receipt. One per line; re-upload replaces the pointer. */
  receipt_url?: string | null
  /** PER-UNIT, PRE-TAX. The worksheet money columns are the *_incl fields. */
  rcv: number | null
  acv: number | null
  tax: number | null
  /** Server-computed; satisfies ext_cost + tax == rcv_total_incl exactly. */
  ext_cost: number | null
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
