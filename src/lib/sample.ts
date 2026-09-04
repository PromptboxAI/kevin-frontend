/**
 * The public sample claim, served at the fetch boundary.
 *
 * WHY HERE AND NOT IN THE WORKSHEET. Screen 48 shows the real adjuster
 * worksheet, and BACKEND-ASKS ask 37 ruled out the two obvious ways to feed it:
 * a `sample` mode inside `WorksheetPage.tsx` (1,850 lines, owned by another
 * agent) and a second read-only grid (CLAUDE.md forbids parallel grids by
 * name). It proposed a third — an unauthenticated read path — which is still
 * the right long-term answer and is not built yet.
 *
 * This is the fourth way ask 37 did not consider: every request in the app
 * funnels through ONE `request()` in api.ts, so the fixture can be served
 * there. `WorksheetPage.tsx` changes by zero lines, there is one rendering
 * path, and nothing waits on the backend. If ask 37 ships, deleting this file
 * and its two call sites leaves the same page running on real data.
 *
 * SCOPE IS THE URL, deliberately. Interception only happens while the browser
 * is on the sample route, so nothing here can affect an authenticated claim
 * even if a path pattern were to match by accident.
 *
 * WRITES NEVER LEAVE THE BROWSER. The screen's contract is "everything is
 * clickable, nothing persists". A write that reached the API would 401 and the
 * demo would look broken, so mutations resolve locally against the fixture and
 * the visitor's edits live in React Query's cache until they navigate away.
 */

import type { ClaimItem } from './types'

export const SAMPLE_CLAIM_ID = 'sample'
export const SAMPLE_PATH = `/claims/${SAMPLE_CLAIM_ID}`

/** Distinct sentinel: `undefined` is a legitimate response body (204). */
export const NOT_SAMPLE = Symbol('not-sample')

export function isSampleRoute(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith(SAMPLE_PATH)
}

/** The fixture is imported once, on first use, and only on the sample route. */
let cache: Promise<typeof import('./sample-data')> | null = null
const data = () => (cache ??= import('./sample-data'))

/** Edits made during the visit. Lost on navigation, which is the point. */
const edits = new Map<number, Partial<ClaimItem>>()

const qs = (path: string) => new URLSearchParams(path.split('?')[1] ?? '')

function applyEdits(item: ClaimItem): ClaimItem {
  const patch = edits.get(item.id)
  return patch ? { ...item, ...patch } : item
}

/**
 * Recompute the money chain for a locally edited row.
 *
 * The server owns this arithmetic in production (rule 20) and the worksheet
 * never does it. Here there is no server, and a demo where typing a price
 * leaves Ext. Cost and ACV stale would teach the wrong thing about the
 * product — so the chain is reproduced EXACTLY as CLAUDE.md states it, in this
 * one file, which exists precisely to stand in for the backend.
 */
function recompute(item: ClaimItem, taxRate: number): ClaimItem {
  if (item.rcv == null) {
    return {
      ...item,
      tax: null,
      ext_cost: null,
      rcv_total_incl: null,
      depreciation_amount: null,
      acv_total_incl: null,
    }
  }
  const r2 = (n: number) => Math.round(n * 100) / 100
  const ext = r2(item.rcv * item.quantity)
  const tax = r2(item.rcv * item.quantity * taxRate)
  const rcvIncl = r2(ext + tax)
  const pct = item.depreciation_pct ?? 0
  const deprAmt = r2(rcvIncl * pct)
  return {
    ...item,
    tax,
    ext_cost: ext,
    rcv_total_incl: rcvIncl,
    depreciation_amount: deprAmt,
    acv_total_incl: r2(rcvIncl - deprAmt),
    acv: r2(item.rcv * (1 - pct)),
  }
}

/**
 * Answer a request from the fixture, or return NOT_SAMPLE to let it through.
 *
 * Unhandled paths deliberately fall through to the network rather than being
 * faked: a 401 that reveals a missing case is better than a silent invention
 * that hides one.
 */
export async function sampleRespond(path: string, method: string): Promise<unknown> {
  if (!isSampleRoute()) return NOT_SAMPLE
  const d = await data()
  const bare = path.split('?')[0]

  if (method === 'GET') {
    if (bare === `/v1/claims/${SAMPLE_CLAIM_ID}`) return d.SAMPLE_CLAIM
    if (bare === `/v1/claims/${SAMPLE_CLAIM_ID}/rooms`) return { rooms: d.SAMPLE_ROOMS }
    if (bare === `/v1/claims/${SAMPLE_CLAIM_ID}/proposals`) return { proposals: [] }
    if (bare === `/v1/claims/${SAMPLE_CLAIM_ID}/photos`) return { photos: [], count: 0 }

    if (bare === '/v1/claim_items') {
      const p = qs(path)
      if (p.get('claim_id') !== SAMPLE_CLAIM_ID) return NOT_SAMPLE
      const limit = Number(p.get('limit') ?? 100)
      const offset = Number(p.get('offset') ?? 0)
      const status = p.get('status')
      const all = d.SAMPLE_ITEMS.map(applyEdits).filter((i) => !status || i.status === status)
      return { items: all.slice(offset, offset + limit), count: all.length, limit, offset }
    }

    // Shared, not claim-scoped, but it 401s without a session -- so on this
    // route it answers with the straight-line default the seed rows carry.
    if (bare === '/v1/depreciation-rules') {
      return { categories: [], rules: {} }
    }
  }

  // Any write against a sample row is applied locally and echoed back in the
  // shape the caller expects, so optimistic UI settles instead of rolling back.
  const patchItem = /^\/v1\/claim_items\/(\d+)/.exec(bare)
  if (patchItem && method !== 'GET') {
    const id = Number(patchItem[1])
    const base = d.SAMPLE_ITEMS.find((i) => i.id === id)
    if (!base) return NOT_SAMPLE
    return applyEdits(base)
  }
  if (bare === '/v1/claim_items/assign-room' && method !== 'GET') {
    return { assigned: 0, item_ids: [] }
  }

  return NOT_SAMPLE
}

/**
 * Record a locally edited row so subsequent reads reflect it.
 *
 * Called from the api boundary after a successful sample write. Kept separate
 * from `sampleRespond` so the read path stays pure.
 */
export async function sampleApplyPatch(id: number, patch: Partial<ClaimItem>) {
  const d = await data()
  const base = d.SAMPLE_ITEMS.find((i) => i.id === id)
  if (!base) return
  const merged = { ...base, ...edits.get(id), ...patch } as ClaimItem
  edits.set(id, recompute(merged, d.SAMPLE_CLAIM.tax_rate ?? 0))
}
