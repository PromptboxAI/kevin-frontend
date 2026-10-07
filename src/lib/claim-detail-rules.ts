/**
 * Claim detail form rules. Import-free, so it compiles and runs standalone
 * under node for its tests.
 *
 * Everything here is about one risk: this screen can change a claim that has
 * already been exported and sent to a carrier. So it sends only what actually
 * changed, it never sends a blank where the server holds a value by accident,
 * and it refuses to let the loss address and the sales tax rate drift apart.
 */

/** Exactly the fields PATCH /v1/claims/{claim_id} accepts. */
export type ClaimDetailForm = {
  name: string
  insured_name: string
  carrier: string
  policy_number: string
  claim_number: string
  loss_type: string
  date_of_loss: string
  loss_address: string
  tax_rate: string
  policy_form: string
  personal_property_limit: string
  personal_property_limit_label: string
  amount_already_claimed: string
  deductible: string
  deductible_label: string
  estimator_name: string
  business_name: string
  claim_rep: string
}

export const EMPTY_FORM: ClaimDetailForm = {
  name: '',
  insured_name: '',
  carrier: '',
  policy_number: '',
  claim_number: '',
  loss_type: '',
  date_of_loss: '',
  loss_address: '',
  tax_rate: '',
  policy_form: '',
  personal_property_limit: '',
  personal_property_limit_label: '',
  amount_already_claimed: '',
  deductible: '',
  deductible_label: '',
  estimator_name: '',
  business_name: '',
  claim_rep: '',
}

type ClaimLike = Partial<Record<keyof ClaimDetailForm, unknown>>

/** Server record -> form strings. Null and undefined both become ''. */
export function formFromClaim(claim: ClaimLike | null | undefined): ClaimDetailForm {
  const out = { ...EMPTY_FORM }
  if (!claim) return out
  for (const key of Object.keys(EMPTY_FORM) as (keyof ClaimDetailForm)[]) {
    const v = claim[key]
    if (v == null) continue
    // tax_rate is a FRACTION on the wire (0.0875) and a percent in the field.
    out[key] = key === 'tax_rate' ? String(pctFromFraction(v as number)) : String(v)
  }
  return out
}

export function pctFromFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0
  return Math.round(fraction * 100 * 1000) / 1000
}

export function fractionFromPct(percent: string): number | null {
  const n = Number(percent)
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return Math.round((n / 100) * 1_000_000) / 1_000_000
}

/** The five-digit ZIP in a loss address, which is what resolves the tax rate. */
export function zipOf(address: string): string {
  const m = address.match(/\b(\d{5})(?:-\d{4})?\b(?!.*\b\d{5}\b)/)
  return m ? m[1] : ''
}

const MONEY_FIELDS = new Set<keyof ClaimDetailForm>([
  'personal_property_limit',
  'amount_already_claimed',
  'deductible',
])

export type FieldError = { field: keyof ClaimDetailForm; message: string }

/**
 * What is wrong, if anything. Only the things that would be WRONG on a
 * carrier-facing document — this is not a form that should nag.
 */
export function validateClaimForm(form: ClaimDetailForm): FieldError[] {
  const out: FieldError[] = []

  if (!form.name.trim()) {
    out.push({ field: 'name', message: 'A project name is required.' })
  }

  if (form.date_of_loss.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_loss.trim())) {
    out.push({ field: 'date_of_loss', message: 'Use YYYY-MM-DD.' })
  }

  if (form.tax_rate.trim() && fractionFromPct(form.tax_rate) == null) {
    out.push({ field: 'tax_rate', message: 'Enter a percentage between 0 and 100.' })
  }

  for (const f of MONEY_FIELDS) {
    const raw = form[f].trim()
    if (!raw) continue
    const n = Number(raw.replace(/[$,]/g, ''))
    if (!Number.isFinite(n) || n < 0) {
      out.push({ field: f, message: 'Enter an amount, or leave it blank.' })
    }
  }

  return out
}

/**
 * ONLY WHAT CHANGED.
 *
 * A PATCH carrying every field would rewrite values this form never showed,
 * and would stamp an edit on an audit trail for fields nobody touched. It also
 * means two people editing different fields do not overwrite each other.
 *
 * A field cleared to empty sends `null` — that is a deliberate erase. A field
 * that was already empty and still is sends nothing at all.
 */
export function claimPatch(
  original: ClaimDetailForm,
  next: ClaimDetailForm,
): Record<string, string | number | null> {
  const patch: Record<string, string | number | null> = {}

  for (const key of Object.keys(EMPTY_FORM) as (keyof ClaimDetailForm)[]) {
    const before = original[key].trim()
    const after = next[key].trim()
    if (before === after) continue

    if (after === '') {
      patch[key] = null
      continue
    }

    if (key === 'tax_rate') {
      const fraction = fractionFromPct(after)
      if (fraction != null) patch[key] = fraction
      continue
    }

    if (MONEY_FIELDS.has(key)) {
      const n = Number(after.replace(/[$,]/g, ''))
      if (Number.isFinite(n)) patch[key] = n
      continue
    }

    patch[key] = after
  }

  return patch
}

export function isDirty(original: ClaimDetailForm, next: ClaimDetailForm): boolean {
  return Object.keys(claimPatch(original, next)).length > 0
}

/**
 * Has the address moved to a ZIP the current tax rate was not resolved from?
 *
 * CLAUDE.md: the loss ZIP resolves the rate, so address and tax must always
 * agree. Editing the address long after intake is exactly how they come apart,
 * and a wrong rate is wrong on every line of the export.
 *
 * Returns the new ZIP when the form should offer to re-resolve, otherwise null.
 */
export function zipChanged(original: ClaimDetailForm, next: ClaimDetailForm): string | null {
  const before = zipOf(original.loss_address)
  const after = zipOf(next.loss_address)
  if (!after || after === before) return null
  return after
}
