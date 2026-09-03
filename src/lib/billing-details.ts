import { ApiError, api } from './api'

/**
 * Payment method and invoice history for the Billing screen.
 *
 * Stripe exposes brand / last4 / expiry and the invoice list safely — none of
 * it is a PAN — so the design's card row and invoice table can be filled with
 * the customer's real details rather than seeded digits. The backend does not
 * serve them YET (`kevin-backend/main.py` has checkout, credits checkout,
 * portal and the webhook, and nothing else billing-shaped), so both fetches
 * tolerate a 404 and resolve to null.
 *
 * That is deliberate: the sections render their designed structure with a quiet
 * empty row today, and fill themselves in the moment the endpoints land, with
 * no further frontend change. See BACKEND-ASKS ask 34.
 *
 * A non-404 error is NOT swallowed — a 500 or an auth failure should surface as
 * an error, not masquerade as "no card on file".
 */

export type PaymentMethod = {
  /** 'visa' | 'mastercard' | 'amex' … as Stripe reports it. */
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  /** Free text, e.g. "Hauppauge, NY". Optional — Stripe may hold no address. */
  billing_city?: string | null
}

export type Invoice = {
  id: string
  /** Stripe's human-facing number, e.g. INV-2026-008. Falls back to id. */
  number?: string | null
  /** ISO date the invoice was created. */
  created: string
  description?: string | null
  /** Minor units, as Stripe reports money. */
  amount_paid: number
  currency: string
  status: string
  /** Stripe-hosted PDF. Absent while an invoice is still a draft. */
  pdf_url?: string | null
}

export type InvoiceListResponse = { invoices: Invoice[] }

/** Resolves to null when the route is not deployed; rethrows anything else. */
async function optional<T>(path: string): Promise<T | null> {
  try {
    return await api.get<T>(path)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) return null
    throw err
  }
}

export const fetchPaymentMethod = () =>
  optional<PaymentMethod>('/v1/billing/payment-method')

export const fetchInvoices = () => optional<InvoiceListResponse>('/v1/billing/invoices')

const BRANDS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
}

export function brandLabel(brand: string): string {
  return BRANDS[brand.toLowerCase()] ?? brand.charAt(0).toUpperCase() + brand.slice(1)
}

/** Stripe reports money in minor units; never divide by 100 at the call site. */
export function fmtMoney(minorUnits: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(minorUnits / 100)
}

export function fmtExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${year}`
}
