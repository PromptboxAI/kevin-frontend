/**
 * The firm's letterhead — the rules, with no React and no fetch in them.
 *
 * ⛔ THIS IS THE ACCOUNT'S CURRENT FIRM, NOT THE PER-CLAIM PREPARER. A claim
 * carries its own `estimator_name` / `business_name` recording who prepared
 * THAT inventory; an estimate is a point-in-time legal document, so it keeps
 * them even after the person leaves the firm. The cover prints both, and they
 * must never collapse into one field (backend 0058).
 *
 * Where it goes: the client-facing PDF and the share-link portal, which a
 * public adjuster puts in front of their CLIENT. Deliberately NOT the .xlsx --
 * XactContents ingests that file and already holds the firm roster, so
 * branding there is noise in something meant to be parsed.
 *
 * Every field is optional and absence is not an error: an account that has
 * never opened this screen exports a valid document with no letterhead at all.
 */

/** What `/v1/me` carries under `business`. Null means "never filled in". */
export type BusinessProfile = {
  business_name: string | null
  contact_name: string | null
  license_number: string | null
  address: string | null
  email: string | null
  phone: string | null
  website: string | null
  /** Set only by the upload route, from bytes it stored. */
  logo_mime: string | null
  /**
   * A SIGNED URL minted on read, never the stored path. It expires, so it is
   * never persisted client-side — re-read `/v1/me` instead of caching it.
   */
  logo_url: string | null
}

/** The editable half, as the form holds it: strings, never null. */
export type BusinessForm = {
  business_name: string
  contact_name: string
  license_number: string
  address: string
  email: string
  phone: string
  website: string
}

/** Order is the form's order, and `PatchBusinessProfile`'s. */
export const BUSINESS_FIELDS = [
  'business_name',
  'contact_name',
  'license_number',
  'address',
  'email',
  'phone',
  'website',
] as const

export type BusinessField = (typeof BUSINESS_FIELDS)[number]

/** Server caps, mirrored so the field can stop typing rather than 422 on save. */
export const BUSINESS_MAX: Record<BusinessField, number> = {
  business_name: 200,
  contact_name: 200,
  license_number: 100,
  address: 500,
  email: 320,
  phone: 50,
  website: 300,
}

export const EMPTY_BUSINESS_FORM: BusinessForm = {
  business_name: '',
  contact_name: '',
  license_number: '',
  address: '',
  email: '',
  phone: '',
  website: '',
}

/** The payload's nulls become empty strings, which is what an input holds. */
export function formFrom(profile: Partial<BusinessProfile> | null | undefined): BusinessForm {
  const out = { ...EMPTY_BUSINESS_FORM }
  if (!profile) return out
  for (const f of BUSINESS_FIELDS) out[f] = profile[f] ?? ''
  return out
}

/**
 * What to PATCH: only the fields that actually changed.
 *
 * A cleared field is sent as `null`, NOT as `""`. The backend patches by
 * `model_fields_set`, so an explicit null is how "I removed this" is said —
 * an empty string would store an empty string and print a blank line on the
 * letterhead. Returns null when nothing changed, so a Save with no edits
 * makes no request at all.
 */
export function businessPatch(
  form: BusinessForm,
  current: BusinessProfile | null | undefined,
): Partial<Record<BusinessField, string | null>> | null {
  const was = formFrom(current)
  const patch: Partial<Record<BusinessField, string | null>> = {}
  let changed = false
  for (const f of BUSINESS_FIELDS) {
    const next = form[f].trim()
    if (next === was[f].trim()) continue
    patch[f] = next === '' ? null : next
    changed = true
  }
  return changed ? patch : null
}

/** True while the form differs from what the server last returned. */
export function isDirty(form: BusinessForm, current: BusinessProfile | null | undefined): boolean {
  return businessPatch(form, current) !== null
}

/**
 * The letterhead as it reads on the document: name, then the person, then the
 * licence, the address, and the ways to reach them on one line.
 *
 * Empty fields are skipped rather than printed blank — a firm with no website
 * has no website line, it does not have an empty one.
 */
export function letterheadLines(form: BusinessForm): string[] {
  const t = (v: string) => v.trim()
  const lines: string[] = []
  if (t(form.business_name)) lines.push(t(form.business_name))
  if (t(form.contact_name)) lines.push(t(form.contact_name))
  if (t(form.license_number)) lines.push(`License ${t(form.license_number)}`)
  if (t(form.address)) lines.push(t(form.address))
  const reach = [t(form.phone), t(form.email), t(form.website)].filter(Boolean)
  if (reach.length) lines.push(reach.join(' · '))
  return lines
}

/* -- the logo ----------------------------------------------------------- */

/**
 * PNG and JPEG only, because ReportLab draws those two and nothing else.
 * WebP and HEIC are ordinary phone formats and it CANNOT draw either, so
 * accepting one would store a logo that silently prints as nothing.
 */
export const LOGO_TYPES = ['image/png', 'image/jpeg'] as const
/** A mark is at most ~150x42pt on the page; 2MB is generous and never slow. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024

export type LogoProblem = 'type' | 'empty' | 'too_large'

export const LOGO_ERROR: Record<LogoProblem, string> = {
  type: 'The logo must be a PNG or JPEG — those are the formats the PDF can draw.',
  empty: 'That file is empty.',
  too_large: 'That logo is too large. The limit is 2 MB.',
}

/**
 * The same three checks the upload route makes, run before the upload rather
 * than after it: a 415 that could have been a sentence is a round trip and a
 * raw error string in front of somebody choosing a file.
 */
export function logoProblem(file: { type: string; size: number }): LogoProblem | null {
  if (!LOGO_TYPES.includes((file.type || '').toLowerCase() as (typeof LOGO_TYPES)[number]))
    return 'type'
  if (file.size === 0) return 'empty'
  if (file.size > LOGO_MAX_BYTES) return 'too_large'
  return null
}
