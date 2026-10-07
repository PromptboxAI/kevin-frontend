/**
 * Derivations for the admin Revenue screen. Import-free, so it compiles and
 * runs standalone under node for its tests.
 *
 * The screen's whole value is that an owner can trust the numbers, so the rules
 * here are mostly about refusing to state things the payload does not support:
 * a month-on-month change with no previous month, a retention figure with
 * nobody to retain, a currency we were not told.
 */

export type MrrByPlan = { plan: string; mrr_cents: number; account_count: number }

export type FailedPayment = {
  user_id?: string | null
  email?: string | null
  plan?: string | null
  amount_cents?: number | null
  failed_at?: string | null
  attempt_count?: number | null
  next_retry_at?: string | null
}

export type EnterpriseContract = {
  user_id?: string | null
  account_name?: string | null
  annual_value_cents?: number | null
  volume_label?: string | null
  renews_on?: string | null
  status?: string | null
}

export type OneTimeStream = {
  type: string
  label: string
  count: number
  amount_cents: number
}

export type RevenueResponse = {
  generated_at?: string | null
  /** "test" means these are not real payments and the screen must say so. */
  stripe_mode?: string | null
  currency?: string | null
  period_days?: number | null
  mrr_cents?: number | null
  mrr_previous_cents?: number | null
  mrr_change_pct_mom?: number | null
  arr_run_rate_cents?: number | null
  mrr_by_plan?: MrrByPlan[] | null
  net_new_mrr_cents?: number | null
  new_count?: number | null
  churned_count?: number | null
  net_revenue_retention_pct?: number | null
  failed_payments?: FailedPayment[] | null
  enterprise_contracts?: EnterpriseContract[] | null
  one_time?: { period_days?: number | null; streams?: OneTimeStream[] | null; total_cents?: number | null } | null
  truncated?: boolean | null
  /** The endpoint's own caveats. Rendered verbatim -- see the screen. */
  notes?: string[] | null
}

/** Cents to dollars. Null stays null: "we were not told" is not "$0.00". */
export function dollars(cents: number | null | undefined): number | null {
  if (cents == null || !Number.isFinite(cents)) return null
  return cents / 100
}

/**
 * Month-on-month, stated only when it means something.
 *
 * `mrr_change_pct_mom` arrives as 0 both when nothing changed and when there is
 * no previous month to compare against, and those read very differently on a
 * dashboard: "flat" is a business fact, "no history yet" is an absence of one.
 * The payload lets us tell them apart via `mrr_previous_cents`.
 */
export function momLabel(
  changePct: number | null | undefined,
  previousCents: number | null | undefined,
  currentCents: number | null | undefined,
): string | null {
  if (previousCents == null || currentCents == null) return null
  if (previousCents === 0) return currentCents > 0 ? 'first month billing' : null
  if (changePct == null || !Number.isFinite(changePct)) return null
  if (changePct === 0) return 'flat on last month'
  const sign = changePct > 0 ? '+' : ''
  return `${sign}${changePct.toFixed(1)}% on last month`
}

/** Up, down, or neither -- drives the arrow, never invented from a zero. */
export function momDirection(
  changePct: number | null | undefined,
  previousCents: number | null | undefined,
): 'up' | 'down' | 'flat' {
  if (previousCents == null || previousCents === 0) return 'flat'
  if (changePct == null || !Number.isFinite(changePct) || changePct === 0) return 'flat'
  return changePct > 0 ? 'up' : 'down'
}

/**
 * Net revenue retention, as a sentence.
 *
 * 100% with nobody churned and nobody expanded is not "holding steady", it is
 * "nothing has happened yet", and on a one-account book the figure is noise.
 * Said plainly rather than dressed as a KPI.
 */
export function nrrLabel(
  pct: number | null | undefined,
  newCount: number | null | undefined,
  churnedCount: number | null | undefined,
): string {
  const n = newCount ?? 0
  const c = churnedCount ?? 0
  if (pct == null) return 'not reported'
  if (n === 0 && c === 0) return 'no movement this period'
  return `${fmtCount(n, 'new')} · ${fmtCount(c, 'churned')}`
}

function fmtCount(n: number, word: string): string {
  return `${n} ${word}`
}

/** Stripe is not in live mode, so nothing on this screen is real money. */
export function isTestMode(mode: string | null | undefined): boolean {
  return (mode ?? '').toLowerCase() !== 'live'
}

/**
 * Accounts behind the recurring figures. Comped and internal accounts carry no
 * Stripe subscription, so they are absent by construction rather than filtered
 * -- which is what rule 9 asks for, and worth stating on the screen so nobody
 * reads a low account count as a bug.
 */
export function billedAccounts(byPlan: MrrByPlan[] | null | undefined): number {
  return (byPlan ?? []).reduce((a, p) => a + (p.account_count ?? 0), 0)
}
