import { api } from './api'
import type { MeResponse } from './types'

/**
 * Billing — Stripe checkout, the credit blocks, and the return leg.
 *
 * Ported from design/components/data.jsx (KevinAPI.billing). The contract is
 * documented in design/INTERACTIONS.md, "Billing — Stripe events and the UI
 * state they produce"; read that before changing anything here.
 *
 * All three endpoints mint a Stripe-hosted session and answer
 * `{ checkout_url, session_id }` — note checkout_url, NOT url. The browser is
 * then redirected there, so no card data ever reaches Kevin.
 *
 * The client NEVER sends a price_id, and never supplies success_url or
 * cancel_url: the server holds both, so a tampered request cannot buy 20,000
 * items for the price of 50 or bounce a paying customer somewhere of an
 * attacker's choosing.
 */

export type CheckoutSession = {
  checkout_url: string
  session_id?: string | null
}

/** Server bounds on a credit block: integer, 50..20,000. */
export const ITEMS_MIN = 50
export const ITEMS_MAX = 20000

/** The blocks offered in the modal. Every one sits inside the server bounds. */
export const CREDIT_BLOCKS = [250, 500, 1000, 2500] as const

/** $0.20 an item — the SAME rate as Pro overage, deliberately. Credits are
 *  never a discount and buying them is never a plan change. */
export const OVERAGE_PRICE = 0.2

/**
 * What the return leg is waiting for. Recorded at checkout time because the
 * redirect races the webhook: landing back on the app proves nothing, so the
 * page has to know which field it expects to move.
 */
export type PendingCheckout =
  | { kind: 'plan'; session_id: string | null; plan_before: string }
  | { kind: 'credits'; session_id: string | null; credits_before: number }

const PENDING_KEY = 'kevin.checkout'

export function readPending(): PendingCheckout | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingCheckout) : null
  } catch {
    // Private mode, or a value we did not write. Not worth failing over — the
    // page simply will not show the confirming banner.
    return null
  }
}

export function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* nothing to clear */
  }
}

function rememberPending(pending: PendingCheckout) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    /* private mode — checkout still works, the return leg just cannot confirm */
  }
}

/** Sends the browser to Stripe. Nothing after this call runs. */
function go(session: CheckoutSession) {
  window.location.assign(session.checkout_url)
}

/** Start (or resume) the Pro subscription. */
export async function startProCheckout(planBefore: string) {
  const session = await api.post<CheckoutSession>('/v1/billing/checkout', { json: {} })
  rememberPending({ kind: 'plan', session_id: session.session_id ?? null, plan_before: planBefore })
  go(session)
  return session
}

/** Buy a one-time block of item credits. */
export async function startCreditsCheckout(items: number, creditsBefore: number) {
  if (!Number.isInteger(items) || items < ITEMS_MIN || items > ITEMS_MAX) {
    // Mirrors the server bound so a bad call fails immediately with something
    // readable, instead of a 422 in the middle of a checkout.
    throw new Error(
      `Credit blocks must be a whole number between ${ITEMS_MIN} and ${ITEMS_MAX.toLocaleString()} items.`,
    )
  }
  const session = await api.post<CheckoutSession>('/v1/billing/credits/checkout', {
    json: { items },
  })
  rememberPending({
    kind: 'credits',
    session_id: session.session_id ?? null,
    credits_before: creditsBefore,
  })
  go(session)
  return session
}

/**
 * The Stripe customer portal — card updates, cancellation and invoice history
 * all live there, so Kevin does not rebuild any of them.
 */
export async function openBillingPortal() {
  const session = await api.post<CheckoutSession>('/v1/billing/portal', { json: {} })
  go(session)
  return session
}

/** Has the thing we were waiting for actually landed? */
export function hasSettled(pending: PendingCheckout, me: MeResponse): boolean {
  return pending.kind === 'plan'
    ? me.plan !== pending.plan_before
    : (me.items?.credits ?? 0) !== pending.credits_before
}

export type PollResult = { settled: boolean; me: MeResponse | null }

/**
 * Poll GET /v1/me until the expected change lands.
 *
 * A redirect back from Stripe is NOT proof of payment — the customer can beat
 * the webhook home, refresh, or close the tab — so billing state is read from
 * /v1/me and never inferred from having arrived on success_url.
 *
 * A timeout is NOT a failure. The money may be fine and the webhook merely
 * slow, so this reports which happened rather than throwing, and callers must
 * say "still confirming", never "payment failed".
 */
export async function pollMe(
  pending: PendingCheckout,
  { tries = 8, intervalMs = 1200 }: { tries?: number; intervalMs?: number } = {},
): Promise<PollResult> {
  let last: MeResponse | null = null
  for (let i = 0; i < tries; i++) {
    try {
      last = await api.get<MeResponse>('/v1/me')
      if (hasSettled(pending, last)) return { settled: true, me: last }
    } catch {
      // Transient — keep polling; the try count is the guard.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return { settled: false, me: last }
}
