/**
 * Phone pairing: the handoff token, and what the desktop may promise about it.
 *
 * Two different credentials, and conflating them is the mistake this module
 * exists to prevent:
 *
 *   HANDOFF token   ~2 minutes, single-use, BURNS on redemption. This is what
 *                   the QR carries. Re-minting is free and invalidates nothing
 *                   — each one stands alone.
 *   CAPTURE token   up to ~12 hours, upload-only, scoped to ONE claim. What
 *                   the phone gets back, sent as `X-Capture-Token`.
 *
 * Revoke kills CAPTURE credentials. It deliberately does not touch unredeemed
 * handoff tokens, which expire on their own in about two minutes — so the
 * "I lost my phone" copy must not claim it stops a code someone photographed.
 *
 * Import-free so it can be tested.
 */

export type PairToken = {
  token: string
  claim_id: string
  expires_at: string
  expires_in_seconds: number
}

export type CaptureToken = {
  capture_token: string
  claim_id: string
  expires_at: string
}

/**
 * Seconds left on a handoff token.
 *
 * Driven by `expires_at`, not by counting down from `expires_in_seconds`: a
 * backgrounded tab stops firing timers, and a phone-shaped countdown that
 * resumes from where it paused would show time the token does not have. The
 * wall clock is the only honest source.
 */
export function secondsLeft(expiresAt: string, now: number): number {
  const end = Date.parse(expiresAt)
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.round((end - now) / 1000))
}

export function isExpired(expiresAt: string, now: number): boolean {
  return secondsLeft(expiresAt, now) <= 0
}

/** `m:ss`, for a countdown under a QR. */
export function fmtCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * The URL the QR encodes.
 *
 * The token rides in the fragment, NOT the query string. A fragment is never
 * sent to a server, never lands in access logs, and is not forwarded in a
 * Referer header — and this value is a bearer credential for someone's claim
 * photos. It costs nothing to put it after the hash and it closes the whole
 * class of "the token showed up in a log".
 */
export function pairUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, '')}/pair#t=${encodeURIComponent(token)}`
}

/** Read the token back off a pair URL, tolerating `?t=` for a typed link. */
export function tokenFromLocation(hash: string, search: string): string | null {
  const fromHash = new URLSearchParams(hash.replace(/^#/, '')).get('t')
  if (fromHash) return fromHash
  return new URLSearchParams(search).get('t')
}

/**
 * Group a token for reading aloud.
 *
 * The phone may be across a room from the screen, and someone will type this
 * rather than scan it. Four-character groups are what people can hold in their
 * head between glances.
 */
export function groupCode(token: string, size = 4): string {
  const clean = token.replace(/\s+/g, '')
  const parts: string[] = []
  for (let i = 0; i < clean.length; i += size) parts.push(clean.slice(i, i + size))
  return parts.join(' ')
}

/** Undo `groupCode` before sending -- people paste what they see. */
export function normaliseCode(input: string): string {
  return input.replace(/\s+/g, '').trim()
}

export type PairFailure = 'invalid' | 'rate_limited' | 'offline' | 'unknown'

/**
 * What to tell someone whose code did not work.
 *
 * The API returns ONE `401` for unknown, expired and already-redeemed, so that
 * a caller cannot probe which it was. The UI must not invent a distinction it
 * was deliberately denied — so the copy covers all three and points at the one
 * action that always works: mint another, which is free.
 */
export const PAIR_FAILURE_COPY: Record<PairFailure, string> = {
  invalid:
    'That code has expired or was already used. Codes last about two minutes — generate a fresh one on the computer.',
  rate_limited: 'Too many attempts. Wait a moment, then try the code again.',
  offline: 'No connection. The code is still valid — try again once you have signal.',
  unknown: 'Pairing failed. Generate a fresh code on the computer and scan it again.',
}

/**
 * Copy for the revoke control.
 *
 * States exactly what it does and does not do. Revoking cannot recall a code
 * that has not been redeemed yet — those die on their own — and saying
 * otherwise would leave someone believing a photographed screen was neutralised
 * when it was not.
 */
export function revokeSummary(revoked: number): string {
  if (revoked === 0) {
    return 'No phone was paired to this claim. Any code already on screen expires on its own within about two minutes.'
  }
  return `Signed out ${revoked} paired ${revoked === 1 ? 'phone' : 'phones'}. ${
    revoked === 1 ? 'It' : 'They'
  } can no longer upload to this claim. Photos already sent are kept.`
}
