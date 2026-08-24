import { portal } from './api'

/**
 * The client portal — the insured's read-only view of a shared claim.
 *
 * The SERVER decides what this audience may see. Locked line detail is never in
 * the payload, so the blur over withheld rows is presentation over data that
 * was never sent; there is nothing behind it to recover with devtools. Never
 * fetch everything and hide it client-side.
 */

/** Identity, deliberately NOT redacted: the audience is the insured. */
export type PortalClaim = {
  claim_id: string
  name: string | null
  insured_name: string | null
  loss_address: string | null
  policy_number: string | null
  claim_number: string | null
  carrier: string | null
  loss_type: string | null
  date_of_loss: string | null
  tax_rate: number | null
}

/**
 * One inventory line as the insured sees it.
 *
 * The whole money chain is present. Showing RCV while hiding ACV is the worst
 * combination -- the big aspirational number, no first-payment number, and no
 * explanation of the gap -- which CAUSES the "why is my check smaller?" call.
 *
 * Absent from the payload by design, and therefore from this type: confidence,
 * alternative_sources, substitution_note / lkq / bucket_used, status,
 * manual_reason and valuation_basis. Do not add them.
 */
export type PortalItem = {
  id: number
  description: string | null
  room_area: string | null
  quantity: number | null
  make_mfr: string | null
  model_number: string | null
  category: string | null
  age_years: number | null
  rcv: number | null
  tax: number | null
  rcv_total_incl: number | null
  depreciation_pct: number | null
  depreciation_amount: number | null
  acv_total_incl: number | null
  claimed_rcv: number | null
  replaced_qty: number | null
  recoverable: number
  receipt_url: string | null
  image_url: string | null
  /** Populated ONLY on paywall sample rows. The link IS the disclosure. */
  source_link: string | null
}

/** The caller's OWN pending new-item proposals, echoed so they don't vanish. */
export type PortalProposal = {
  id: number
  description: string
  room: string | null
  quantity: number
  age_years: number | null
  claimed_rcv: number | null
  created_at: string | null
}

export type PortalTotals = {
  item_count: number
  total_rcv: number
  total_acv: number
  total_tax: number
  total_depreciation: number
}

export type PortalResponse = {
  claim: PortalClaim
  items: PortalItem[]
  /** Total items on the claim, for paging. */
  count: number
  limit: number
  offset: number
  /** allow_download AND released_at -- never the adjuster's own exported_at. */
  can_download: boolean
  expires_at: string | null
  /** Null = no paywall. A number for the lock screen to display. */
  unlock_price: number | null
  /** Set ONLY by the verified payment webhook. */
  paid: boolean
  /** How many lines are withheld; the UI renders skeletons from the count. */
  locked_count: number
  /** Visible while locked ON PURPOSE: the total is the proof, not the product. */
  totals: PortalTotals | null
  proposals: PortalProposal[]
  /** Every figure is the ADJUSTER'S ESTIMATE. Rendered, never paraphrased. */
  disclaimer: string
}

export type CheckoutResponse = {
  status: string
  checkout_url: string
  amount_cents: number
}

export function getPortal(token: string, offset = 0, limit = 100) {
  return portal.get<PortalResponse>(token, `?offset=${offset}&limit=${limit}`)
}

/**
 * Start the hosted Stripe Checkout.
 *
 * Takes NO body: the amount is read from the share row. The browser can see
 * the price on the page; it must never be able to send one.
 */
export function startCheckout(token: string) {
  return portal.post<CheckoutResponse>(token, '/checkout')
}

/**
 * `paid` flips on the payment WEBHOOK, never on the browser's return URL.
 *
 * Stripe sends the client back before the webhook lands as often as not, and a
 * redirect carrying ?status=complete is forgeable. So a return is a reason to
 * POLL, never a reason to unlock.
 */
export const RETURNED_FROM_CHECKOUT = (search: string) =>
  new URLSearchParams(search).get('status') === 'complete'

/** Backs off so a webhook that never lands stops hammering the endpoint. */
export function pollDelay(attempt: number): number {
  return Math.min(1000 * 2 ** Math.floor(attempt / 2), 8000)
}

export const POLL_ATTEMPTS = 20

/**
 * The claim document for a released link.
 *
 * Gated by BOTH `allow_download` and `released_at`, which the payload has
 * already collapsed into `can_download` -- so the button only exists when the
 * server would answer. The bytes are the same builder the adjuster's own export
 * uses; a plain link is enough, and it keeps the filename the server sets.
 */
export function portalExportUrl(token: string, format: 'xlsx' | 'pdf'): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? ''
  return `${base}/p/${encodeURIComponent(token)}/export?format=${format}`
}
