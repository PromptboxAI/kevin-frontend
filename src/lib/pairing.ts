import { api } from './api'
import type { CaptureToken, PairToken } from './pair-rules'

/**
 * Phone pairing.
 *
 * `mintPairToken` and `revokeCapture` are the adjuster's, and need a session.
 * `redeemPair` is PUBLIC by design -- the phone has no account, and requiring
 * one is the friction the whole flow exists to remove.
 */

/** Single-use, ~2 minutes, returned ONCE. Re-minting is free. */
export function mintPairToken(claimId: string) {
  return api.post<PairToken>(`/v1/claims/${encodeURIComponent(claimId)}/pair-token`)
}

/**
 * "I lost my phone" -- kills every live CAPTURE credential on the claim.
 *
 * Does not touch an unredeemed handoff token; those expire on their own.
 * Idempotent, and `revoked: 0` is a normal answer rather than an error.
 */
export function revokeCapture(claimId: string) {
  return api.post<{ status: string; claim_id: string; revoked: number }>(
    `/v1/claims/${encodeURIComponent(claimId)}/pair-token/revoke`,
  )
}

/**
 * Redeem a handoff token for an upload-only credential.
 *
 * Unknown, expired and already-redeemed all come back as the same `401` so a
 * caller cannot probe which it was -- do not try to tell them apart.
 */
export function redeemPair(token: string) {
  return api.post<CaptureToken>('/v1/pair', { json: { token } })
}

/**
 * The capture credential's header.
 *
 * Deliberately NOT `Authorization: Bearer` -- it is not a Supabase JWT, and
 * putting it there would make an upload-only credential look like a session to
 * every other endpoint.
 */
export function captureHeader(captureToken: string): Record<string, string> {
  return { 'X-Capture-Token': captureToken }
}
