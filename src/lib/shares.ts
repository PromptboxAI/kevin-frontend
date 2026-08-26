import { api } from './api'

/**
 * Share links — the adjuster's side of the client portal.
 *
 * A share is a token-scoped, read-only snapshot of a claim. The adjuster mints
 * one, sends it, and (for a paywalled link) the client pays to unlock the full
 * inventory. Everything the adjuster needs to know about that lifecycle lives
 * on this record.
 */

export type ShareSummary = {
  id: string
  claim_id: string
  audience: 'client' | 'carrier'
  /** Null once revoked -- the token is destroyed, not hidden. */
  token: string | null
  url: string | null
  /** Derived liveness. Read THIS, never compare expires_at yourself. */
  active: boolean
  expires_at: string | null
  revoked_at: string | null
  allow_download: boolean
  /** The adjuster deliberately letting the file go. Not `exported_at`. */
  released_at: string | null
  /**
   * Set ONLY by the signature-verified Stripe webhook, and the single most
   * important fact this list shows: whether a priced link was bought. A paid
   * link needs no `released_at` -- payment IS the entitlement.
   */
  paid_at: string | null
  /** Delivery of the paid document. */
  delivered_at: string | null
  /**
   * Surfaced, never only logged: a silent bounce on something already paid
   * for is the worst failure this feature has.
   */
  delivery_error: string | null
  view_count: number
  last_viewed_at: string | null
  created_at: string | null
  /** Null = no paywall. FROZEN at mint -- a different price is a different link. */
  unlock_price: number | null
}

export type MintShareBody = {
  audience?: 'client' | 'carrier'
  ttl_days?: number | null
  allow_download?: boolean
  /**
   * Strictly positive when present. A zero-price paywall renders a lock screen
   * that charges nothing, which is a broken screen rather than a free one.
   */
  unlock_price?: number | null
}

export function listShares(claimId: string) {
  return api.get<{ claim_id: string; shares: ShareSummary[] }>(
    `/v1/claims/${encodeURIComponent(claimId)}/shares`,
  )
}

/** Singular `/share` — the plural path is the LIST and 405s on POST. */
export function mintShare(claimId: string, body: MintShareBody) {
  return api.post<ShareSummary & { status: string; share_id: string }>(
    `/v1/claims/${encodeURIComponent(claimId)}/share`,
    { json: body },
  )
}

/** Permanent. The token is destroyed, so a revoked link cannot be un-revoked. */
export function revokeShare(shareId: string) {
  return api.delete<{ status: string }>(`/v1/shares/${encodeURIComponent(shareId)}`)
}

/**
 * Retry delivery of a PAID share's document.
 *
 * 409 when the link was never paid for — there is nothing to deliver, and the
 * UI should not offer the button in that state at all.
 */
export function redeliverShare(shareId: string) {
  return api.post<{ status: string }>(`/v1/shares/${encodeURIComponent(shareId)}/redeliver`)
}

export {
  shareState,
  SHARE_STATE_LABEL,
  SHARE_STATE_TONE,
  countUnsubstantiated,
} from './share-rules'
export type { ShareState } from './share-rules'
