/**
 * Storage & fair use, derived from the account's real claims.
 *
 * Lifted from `KEVIN_STORAGE` in `design/components/data.jsx`, with the design's
 * own constants intact. CLAUDE.md rule 19 is explicit that the used figure is
 * DERIVED from actual photo counts × the average photo size, never a typed-in
 * GB literal — so this takes the claim list the app already fetches
 * (`photo_count` is on every ClaimSummary) and does exactly that.
 *
 * Import-free so it runs under `node --input-type=module` for its tests.
 *
 * The warm/cold split is the COGS lever and nothing else: closed claims tier to
 * archived storage, still fully accessible, just slower on first load. Nothing
 * is ever deleted to reclaim space (rules 15 and 19).
 */

/** iPhone HEIC → JPEG, typical field capture. */
export const STORAGE_AVG_PHOTO_MB = 4.2
export const STORAGE_COLD_AFTER_DAYS = 90

/** Pro's allowance. An Enterprise contract carries its own, so it is a parameter. */
export const PRO_INCLUDED_GB = 500
export const STORAGE_OVERAGE_GB = 500
export const STORAGE_OVERAGE_PRICE = 19

export type StorageClaim = {
  photo_count: number
  /** Set once the claim is closed; drives the warm/cold split. */
  closed_at?: string | null
  archived_at?: string | null
}

export type StorageUsage = {
  includedGB: number
  overageGB: number
  overagePrice: number
  coldAfterDays: number
  avgPhotoMB: number
  photos: number
  claims: number
  warmClaims: number
  coldClaims: number
  warmGB: number
  coldGB: number
  usedGB: number
  pct: number
}

export function gbForPhotos(photos: number): number {
  return (photos * STORAGE_AVG_PHOTO_MB) / 1024
}

/**
 * A claim counts as archived storage once it is closed or archived. The design
 * keys off `status === 'closed'`; the API carries `closed_at` / `archived_at`
 * timestamps instead, and either one means the claim is off the working set.
 */
export function isCold(claim: StorageClaim): boolean {
  return Boolean(claim.closed_at) || Boolean(claim.archived_at)
}

export function buildStorage(
  claims: StorageClaim[],
  includedGB: number = PRO_INCLUDED_GB,
): StorageUsage {
  const cold = claims.filter(isCold)
  const warm = claims.filter((c) => !isCold(c))
  const coldGB = cold.reduce((a, c) => a + gbForPhotos(c.photo_count), 0)
  const warmGB = warm.reduce((a, c) => a + gbForPhotos(c.photo_count), 0)
  const usedGB = warmGB + coldGB
  return {
    includedGB,
    overageGB: STORAGE_OVERAGE_GB,
    overagePrice: STORAGE_OVERAGE_PRICE,
    coldAfterDays: STORAGE_COLD_AFTER_DAYS,
    avgPhotoMB: STORAGE_AVG_PHOTO_MB,
    photos: claims.reduce((a, c) => a + c.photo_count, 0),
    claims: claims.length,
    warmClaims: warm.length,
    coldClaims: cold.length,
    warmGB,
    coldGB,
    usedGB,
    // Capped at 100 so an over-pool account cannot push the bar past its track.
    pct: includedGB > 0 ? Math.min(Math.round((usedGB / includedGB) * 1000) / 10, 100) : 0,
  }
}

export function fmtGB(n: number): string {
  return (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + ' GB'
}

export function fmtPool(n: number): string {
  return n >= 1000 ? n / 1000 + ' TB' : n + ' GB'
}

/** Bar width as a percentage, floored so a non-zero slice stays visible. */
export function barPct(part: number, includedGB: number): number {
  if (includedGB <= 0) return 0
  return Math.max((part / includedGB) * 100, 0.6)
}
