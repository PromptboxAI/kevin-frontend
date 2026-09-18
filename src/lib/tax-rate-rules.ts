/**
 * What the intake "Local tax rate" select offers, from `GET /v1/tax-rate`.
 *
 * Import-free so it runs under node for the tests. The query lives in
 * lib/tax-rate.ts; this decides only the options and the words.
 *
 * The contract's three rules (FRONTEND.md, "GET /v1/tax-rate"):
 *  1. `confirm_required` is always true on the payload. OWNER'S DECISION,
 *     2026-09-18: the table is the USPS-sourced rate list, so a resolved rate
 *     is selected as-is -- no "choose to confirm" step. The select still lets
 *     the adjuster change it.
 *  2. `suggested_rate: null` is a normal answer (the endpoint is always 200).
 *  3. An ambiguous ZIP gets its `rate_range` ends, never a midpoint -- a
 *     midpoint is a rate nobody charges.
 * And `0.0` is a real rate (Oregon, Delaware…), never read as missing.
 */

export type TaxRateAnswer = {
  zip: string | null
  suggested_rate: number | null
  rate_range: [number, number] | null
  jurisdictions: string[]
  state: string | null
  ambiguous: boolean
  confirm_required: boolean
  as_of: string | null
  stale: boolean
  reason: string | null
}

/** `rate` is a PERCENT; null = nothing chosen, so no tax_rate is sent. */
export type TaxOption = { label: string; rate: number | null }

export type TaxPlan = {
  options: TaxOption[]
  hint: string
  /** True while the adjuster still has to pick: Continue waits for it. */
  needsChoice: boolean
}

/** A rate the adjuster added by hand for a ZIP the table lacks. */
export type ManualJurisdiction = { zip: string; label: string; rate: number }

export const NO_TAX: TaxOption = { label: 'No tax · 0%', rate: 0 }

/** Fraction -> percent, at most three decimals: 0.08875 -> 8.875. */
export function pct(fraction: number): number {
  return Math.round(fraction * 100 * 1000) / 1000
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())

export function taxPlanFor(
  zip: string,
  answer: TaxRateAnswer | null,
  manual: ManualJurisdiction | null,
  loading: boolean,
): TaxPlan {
  if (zip.length < 5) {
    return {
      options: [{ label: 'Enter the loss ZIP first', rate: null }],
      hint: 'Suggested from the loss ZIP',
      needsChoice: false,
    }
  }

  // Typed by the adjuster: already accepted, nothing to confirm.
  if (manual) {
    return {
      options: [{ label: `${manual.label} (${zip}) · ${manual.rate}%`, rate: manual.rate }, NO_TAX],
      hint: 'Added by you for this ZIP',
      needsChoice: false,
    }
  }

  if (loading && !answer) {
    return {
      options: [{ label: `Looking up ${zip}…`, rate: null }],
      hint: 'Suggested from the loss ZIP',
      needsChoice: true,
    }
  }

  const asOf = answer?.as_of ? ` · rates as of ${answer.as_of}` : ''
  const stale = answer?.stale ? ' · may be out of date' : ''

  if (answer && answer.ambiguous && answer.rate_range) {
    const [lo, hi] = answer.rate_range.map(pct)
    return {
      options: [
        { label: `Choose — ${zip} spans ${lo}–${hi}%`, rate: null },
        { label: `${lo}% · low end of ${zip}`, rate: lo },
        { label: `${hi}% · high end of ${zip}`, rate: hi },
        NO_TAX,
      ],
      hint: `This ZIP crosses tax lines — pick the side the loss is on${asOf}${stale}`,
      needsChoice: true,
    }
  }

  if (answer && answer.reason === null && typeof answer.suggested_rate === 'number') {
    const rate = pct(answer.suggested_rate)
    const where = answer.jurisdictions.length
      ? answer.jurisdictions.map(titleCase).join(' + ')
      : zip
    return {
      options: [
        { label: `${where}${answer.state ? `, ${answer.state}` : ''} (${zip}) · ${rate}%`, rate },
        NO_TAX,
      ],
      hint: `${asOf}${stale}`.replace(/^ · /, ''),
      needsChoice: false,
    }
  }

  // zip_not_in_table, no_zip, table_unavailable, or the lookup failed: an
  // empty field, never an error.
  return {
    options: [{ label: `No rate on file for ${zip}`, rate: null }, NO_TAX],
    hint: 'Add the jurisdiction, or set the rate later on the claim',
    needsChoice: false,
  }
}
