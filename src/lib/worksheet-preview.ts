import { api } from './api'
import type { ClaimItem } from './types'

/**
 * `GET /v1/worksheet/preview` — the server computes one line's derived money
 * and stores nothing. Answers anonymously, which is the whole point: it is how
 * the public sample claim (screen 48) shows a live worksheet without a write.
 *
 * WHY THIS EXISTS RATHER THAN LOCAL MATH. /sample is signed out, so
 * `PATCH …/override` returns 401 and the server never recomputes — the typed
 * value stuck in the cell while Ext. Cost, Depr. and ACV stayed stale, which is
 * worse than refusing the edit because the row then shows 3 x $11.00 = $11.00.
 * The obvious fix is to recompute in the browser, and it is the wrong one:
 * rule 20 deleted `computeACV()` precisely so there is ONE implementation of
 * the chain, and a second one scoped to the demo would drift silently in the
 * direction of looking plausible. This endpoint runs the real
 * `services.money.line_money` and the real depreciation engine, so the demo
 * cannot disagree with the product.
 *
 * The contract is also easy to get subtly wrong by hand: `tax` is a breakout
 * already inside the inclusive total, `ext_cost + tax == rcv_total_incl`
 * exactly, and depreciation applies to the TAX-INCLUSIVE rcv — 50% of a $110
 * inclusive total is $55, not $50.
 *
 * Real claims are untouched and keep persisting through `…/override`.
 */

/** The one place this string is defined; App.tsx's route gate imports it. */
export const SAMPLE_CLAIM_ID = 'sample'

export type PreviewParams = {
  /** PER-UNIT and PRE-TAX, matching `ClaimItem.rcv`. */
  rcv: number
  quantity: number
  /** A fraction: 0.08625 = 8.625%. */
  tax_rate: number
  age_years?: number | null
  category?: string | null
  depreciation_method?: ClaimItem['depreciation_method']
  /** A fraction, and it WINS over age_years when both are sent. */
  depreciation_pct?: number | null
}

export type PreviewResponse = {
  tax: number | null
  ext_cost: number | null
  rcv_total_incl: number | null
  depreciation_pct: number | null
  depreciation_amount: number | null
  acv_total_incl: number | null
  /** True when a class ceiling stopped the ACV falling any further. */
  depreciation_capped: boolean
}

export function previewLine(params: PreviewParams): Promise<PreviewResponse> {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    // Null means UNSET, not zero. Sending `age_years=` would be a value.
    if (value === null || value === undefined || value === '') continue
    qs.set(key, String(value))
  }
  return api.get<PreviewResponse>(`/v1/worksheet/preview?${qs.toString()}`)
}

/**
 * Merge an edit into the row, then ask the server what the money becomes.
 *
 * `current` supplies the fields the edit did not touch — preview is stateless,
 * so it needs the whole line, not the delta. Returns the same money block the
 * write path returns, so callers apply it through `moneyFrom` without knowing
 * which endpoint answered.
 */
export async function previewEdit(
  current: Pick<
    ClaimItem,
    'rcv' | 'quantity' | 'age_years' | 'category' | 'depreciation_pct' | 'depreciation_method'
  >,
  edit: {
    rcv?: number
    quantity?: number
    age_years?: number
    category?: string
    dep_manual?: number
    depreciation_method?: ClaimItem['depreciation_method']
  },
  taxRate: number,
): Promise<PreviewResponse | null> {
  const rcv = edit.rcv ?? current.rcv
  // An unpriced row stays unpriced (rule 12): no rcv, no derived money, and
  // the cells keep rendering a dash rather than zeros.
  if (rcv == null) return null

  const age = edit.age_years ?? current.age_years

  /**
   * Rate precedence, and getting it wrong blanks the ACV.
   *
   * 1. A rate the adjuster just typed wins outright — that is what
   *    `dep_manual` means, and the endpoint gives `depreciation_pct` the same
   *    priority over `age_years`.
   * 2. Otherwise an age lets the server derive the rate from the schedule.
   * 3. Otherwise carry the row's EXISTING rate. Rows arrive priced with a
   *    stored `depreciation_pct` and no age at all; dropping it asked the
   *    server to price a line with no rate and no age, and it correctly
   *    returned nulls — so changing the quantity on a depreciated row wiped
   *    its ACV to a dash.
   */
  const manual = edit.dep_manual
  const pct = manual != null ? manual : age == null ? current.depreciation_pct : null

  return previewLine({
    rcv,
    quantity: edit.quantity ?? current.quantity,
    tax_rate: taxRate,
    age_years: pct != null ? null : age,
    category: edit.category ?? current.category,
    depreciation_method: edit.depreciation_method ?? current.depreciation_method ?? undefined,
    depreciation_pct: pct,
  })
}
