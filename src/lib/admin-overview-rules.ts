/**
 * Derivations for the admin Overview. Import-free, so it compiles and runs
 * standalone under node for its tests.
 *
 * The Overview's job is one question — "is anything wrong, and how is the
 * business" — so everything here is about ranking and about refusing to show a
 * meter for a thing that has no measurement.
 */

export type LimitRow = {
  key: string
  name: string
  used?: number | null
  limit?: number | null
  unit?: string | null
  period?: string | null
  percent_used?: number | null
  state?: string | null
  how_to_raise?: string | null
}

export type LimitsResponse = {
  state?: string | null
  /** Keys the server itself flagged. Authoritative — we never second-guess it. */
  attention?: string[] | null
  thresholds?: { warning_percent?: number | null; critical_percent?: number | null } | null
  limits?: LimitRow[] | null
}

/**
 * Limits that can actually be drawn as a meter.
 *
 * Of fifteen rows the live payload returns, several carry `used: null` and
 * `limit: null` — Supabase, Railway, the Anthropic credit balance — because
 * nothing reports them yet. A bar at 0% for those would say "plenty of room"
 * about something we cannot see at all, which is the opposite of true.
 */
export function meteredLimits(limits: LimitRow[] | null | undefined): LimitRow[] {
  return (limits ?? []).filter(
    (l) =>
      typeof l.percent_used === 'number' &&
      Number.isFinite(l.percent_used) &&
      typeof l.limit === 'number' &&
      l.limit > 0,
  )
}

/** Worst first, so the one about to run out is at the top rather than in order. */
export function byPressure(limits: LimitRow[]): LimitRow[] {
  return [...limits].sort((a, b) => (b.percent_used ?? 0) - (a.percent_used ?? 0))
}

export type AccountRow = {
  billing_state?: string | null
  plan?: string | null
}

export type AccountBreakdown = {
  total: number
  active: number
  trial: number
  pastDue: number
  /** Comped and internal — real accounts, but never revenue. */
  nonBilling: number
}

/**
 * Counts by billing state.
 *
 * Reads `billing_state` and NOT `plan`: the two are independent columns and
 * live data holds accounts at `plan: "pro", billing_state: "trial"` (rule 9b).
 * The state answers "is anything being charged", which is the question an
 * Overview asks; plan answers "how big is the allowance", which it does not.
 */
export function accountBreakdown(accounts: AccountRow[] | null | undefined): AccountBreakdown {
  const rows = accounts ?? []
  const is = (r: AccountRow, s: string) => (r.billing_state ?? '').toLowerCase() === s
  return {
    total: rows.length,
    active: rows.filter((r) => is(r, 'active')).length,
    trial: rows.filter((r) => is(r, 'trial')).length,
    pastDue: rows.filter((r) => is(r, 'past_due')).length,
    nonBilling: rows.filter((r) => is(r, 'comped') || is(r, 'internal')).length,
  }
}

export type Attention = {
  key: string
  label: string
  /** 0 is most serious. Drives both order and tone. */
  rank: 0 | 1 | 2
  to?: string
}

/**
 * What needs attention, worst first.
 *
 * Ranked by who is hurt and how soon: a customer's work failing outranks our
 * own money, which outranks a vendor ceiling we are merely approaching. The
 * Overview exists to be glanced at, so the order IS the message.
 *
 * Returns an empty list when nothing is wrong — the screen says so plainly
 * rather than inventing a "0 issues" tile.
 */
export function attentionItems(input: {
  failedJobs?: number | null
  failedPayments?: number | null
  pastDueAccounts?: number | null
  pricingDegraded?: boolean
  limits?: LimitsResponse | null
}): Attention[] {
  const out: Attention[] = []

  if ((input.failedJobs ?? 0) > 0) {
    const n = input.failedJobs as number
    out.push({
      key: 'failed_jobs',
      label: `${n} failed job${n === 1 ? '' : 's'} — a customer's work did not finish`,
      rank: 0,
      to: '/admin/system',
    })
  }

  if (input.pricingDegraded) {
    out.push({
      key: 'pricing',
      label: 'Pricing is degraded — lines may not be getting comps',
      rank: 0,
      to: '/admin/system',
    })
  }

  if ((input.failedPayments ?? 0) > 0) {
    const n = input.failedPayments as number
    out.push({
      key: 'failed_payments',
      label: `${n} failed payment${n === 1 ? '' : 's'}`,
      rank: 1,
      to: '/admin/revenue',
    })
  }

  if ((input.pastDueAccounts ?? 0) > 0) {
    const n = input.pastDueAccounts as number
    out.push({
      key: 'past_due',
      label: `${n} account${n === 1 ? ' is' : 's are'} past due`,
      rank: 1,
      to: '/admin/accounts',
    })
  }

  /*
   * The server's own `attention` list, not our reading of the percentages. It
   * knows things a percentage cannot carry -- stripe_mode is flagged with no
   * number at all -- so re-deriving this from thresholds would quietly drop
   * whatever does not happen to be a meter.
   */
  for (const key of input.limits?.attention ?? []) {
    const row = (input.limits?.limits ?? []).find((l) => l.key === key)
    const critical = (row?.state ?? '').toLowerCase() === 'critical'
    out.push({
      key: `limit:${key}`,
      label: row?.name ? `${row.name}${pctSuffix(row)}` : key,
      rank: critical ? 0 : 2,
      to: '/admin/system',
    })
  }

  return out.sort((a, b) => a.rank - b.rank)
}

function pctSuffix(row: LimitRow): string {
  return typeof row.percent_used === 'number' && Number.isFinite(row.percent_used)
    ? ` — ${Math.round(row.percent_used)}% used`
    : ''
}
