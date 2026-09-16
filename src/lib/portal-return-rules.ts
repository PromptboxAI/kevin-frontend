/**
 * What `/p/return` does with a browser coming back from Stripe.
 *
 * Since backend 7965a71 the checkout's success/cancel URL is
 * `{SHARE_BASE_URL}/p/return?status=complete|cancelled` with NO share token:
 * the token is a bearer credential for the whole claim, and it used to sit in
 * Stripe's session record and on the dashboard row a human reconciles against.
 * The browser restores its own link instead (sessionStorage, stashed before
 * the redirect).
 *
 * `status` is a HINT, never proof. The webhook races the redirect constantly,
 * so the share page polls `GET /p/{token}` until `paid` flips; this only
 * decides where to send the browser.
 *
 * Import-free, so it runs under node for the tests.
 */

export type ReturnDecision =
  /** Go back to the share; `status=complete` tells that page to start polling. */
  | { kind: 'open'; path: string }
  /** No stored token (new tab, cleared storage, another device) -- not an error. */
  | { kind: 'paid-elsewhere' }
  | { kind: 'cancelled-elsewhere' }

export function decideReturn(token: string | null | undefined, status: string | null): ReturnDecision {
  const clean = (token ?? '').trim()
  if (clean) {
    const path = `/p/${encodeURIComponent(clean)}`
    // Only a completed checkout arms the polling state on the share page; a
    // cancel returns to a page that should look untouched.
    return { kind: 'open', path: status === 'complete' ? `${path}?status=complete` : path }
  }
  return status === 'cancelled' ? { kind: 'cancelled-elsewhere' } : { kind: 'paid-elsewhere' }
}
