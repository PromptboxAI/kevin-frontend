/** The API's own constraint on claim_id: ^[A-Za-z0-9_-]{1,64}$ */
export const CLAIM_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Derive the URL-safe claim_id from the claim's name.
 *
 * claim_id is the claim's identity in every URL and export, so it is derived
 * once from the name and then left alone -- editing it later would orphan an
 * export already sent to a carrier.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '')
}

export function isValidClaimId(id: string): boolean {
  return CLAIM_ID_PATTERN.test(id)
}

/**
 * A percentage as typed by the adjuster -> the fraction the API stores.
 * 8.625 -> 0.08625. The API rejects anything above 1, which is exactly the
 * mistake of sending a percent where a fraction belongs.
 */
export function percentToFraction(input: string): number | null {
  const text = input.trim().replace('%', '')
  if (!text) return null
  const value = Number(text)
  if (!Number.isFinite(value) || value < 0 || value > 100) return null
  return Math.round((value / 100) * 1e6) / 1e6
}

/** ISO "YYYY-MM-DD" as the API wants it, or null. */
export function toIsoDate(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
}

/**
 * A money amount as typed -> the number the API stores. Tolerates the way an
 * adjuster actually types a limit: "$175,000" or "175000.00".
 * Null means "not provided"; the API rejects negatives (ge=0).
 */
export function parseMoney(input: string): number | null {
  const text = input.trim().replace(/[$,\s]/g, '')
  if (!text) return null
  const value = Number(text)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100) / 100
}
